/**
 * maildrop — Cloudflare Email Worker
 *
 * Stage 2: MIME parsing + conditional routing.
 *
 * Test locally with:
 *   npx wrangler dev
 *   curl -X POST "http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=test@yourdomain.com" \
 *     -H "Content-Type: message/rfc822" \
 *     --data-binary @test-email.eml
 */

import PostalMime from "postal-mime";
import { type ParsedEmail, matchRule } from "./filter";

export default {
  async fetch(
    _request: Request,
    _env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    return new Response("maildrop running\n", {
      headers: { "Content-Type": "text/plain" },
    });
  },

  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log(`[maildrop] Incoming: ${message.from} -> ${message.to}`);

    // ── 1. Parse raw MIME ──────────────────────────────────────────
    const parser = new PostalMime();
    const parsed = await parser.parse(message.raw);

    const email: ParsedEmail = {
      from: message.from,
      to: message.to,
      subject: parsed.subject ?? "(no subject)",
      textPlain: parsed.text ?? "",
      textHtml: parsed.html ?? undefined,
    };

    console.log(`[maildrop] Subject: ${email.subject}`);
    console.log(`[maildrop] Body preview: ${email.textPlain.slice(0, 120)}`);

    // ── 2. Match against filter rules ──────────────────────────────
    const rule = matchRule(email);
    console.log(`[maildrop] Rule matched: "${rule.name}" → ${rule.action}`);

    // ── 3. Execute action ──────────────────────────────────────────
    switch (rule.action) {
      case "reject":
        message.setReject(rule.target ?? "No reason given");
        console.log(`[maildrop] REJECTED: ${rule.target}`);
        break;

      case "forward":
        if (rule.target && rule.target !== "REPLACE_WITH_VERIFIED_ADDRESS") {
          await message.forward(rule.target);
          console.log(`[maildrop] FORWARDED to ${rule.target}`);
        } else {
          console.log(
            `[maildrop] FORWARD skipped (no verified target configured)`,
          );
        }
        break;

      case "reply": {
        const replyMime = buildReplyMime(
          message.to,         // From: our domain
          message.from,       // To: original sender
          email.subject,
          rule.target ?? "Thank you for your email.",
        );
        // EmailMessage is a runtime constructor available in the Workers
        // environment; at compile time we use the interface shape instead.
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const replyMsg = {
          from: message.to,
          to: message.from,
          raw: replyMime,
        } as EmailMessage;
        await message.reply(replyMsg);
        console.log(`[maildrop] REPLIED to ${message.from}`);
        break;
      }

      case "accept":
      default:
        console.log("[maildrop] ACCEPTED (no action)");
        break;
    }
  },
};

/**
 * Build a minimal reply MIME string.
 */
function buildReplyMime(
  replyFrom: string,
  replyTo: string,
  originalSubject: string,
  body: string,
): string {
  const cleanSubject = originalSubject.startsWith("Re:")
    ? originalSubject
    : `Re: ${originalSubject}`;
  return [
    `From: ${replyFrom}`,
    `To: ${replyTo}`,
    `Subject: ${cleanSubject}`,
    `Message-ID: <maildrop-reply-${Date.now()}@local>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
}
