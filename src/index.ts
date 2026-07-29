/**
 * maildrop — Cloudflare Email Worker
 *
 * Stage 3: D1 persistence + HTTP API.
 *
 * email() handler: parse → filter → execute → save to D1.
 * fetch() handler:
 *   GET /              → status
 *   GET /inbox         → list recent emails (JSON)
 *   GET /inbox/<id>    → single email detail (JSON)
 */

import PostalMime from "postal-mime";
import { type ParsedEmail, matchRule } from "./filter";
import { saveEmail, listEmails, getEmail } from "./storage";

export default {
  // ── HTTP API ─────────────────────────────────────────────────────
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const inboxMatch = url.pathname.match(/^\/inbox\/(.+)$/);

    if (url.pathname === "/inbox") {
      const emails = await listEmails(env.DB);
      return Response.json(emails);
    }

    if (inboxMatch) {
      const email = await getEmail(env.DB, inboxMatch[1]);
      if (!email) {
        return new Response("Not found", { status: 404 });
      }
      return Response.json(email);
    }

    return new Response("maildrop running\n", {
      headers: { "Content-Type": "text/plain" },
    });
  },

  // ── Email handler ────────────────────────────────────────────────
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log(`[maildrop] Incoming: ${message.from} -> ${message.to}`);

    // Parse raw MIME
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

    // Match against filter rules
    const rule = matchRule(email);
    console.log(`[maildrop] Rule: "${rule.name}" → ${rule.action}`);

    // Execute action (wrapped so errors don't bounce the email)
    try {
      switch (rule.action) {
        case "reject":
          message.setReject(rule.target ?? "No reason given");
          break;
        case "drop":
          // Silently discard — no SMTP response to sender
          break;
        case "forward":
          if (rule.target && rule.target !== "REPLACE_WITH_VERIFIED_ADDRESS") {
            await message.forward(rule.target);
          }
          break;
        case "reply": {
          const replyMime = buildReplyMime(
            message.to,
            message.from,
            email.subject,
            rule.target ?? "Thank you for your email.",
          );
          // EmailMessage is a constructor at runtime (in the Workers
          // environment) but appears as only an interface in generated types.
          // @ts-expect-error EmailMessage constructor exists at runtime
          await message.reply(new EmailMessage(message.to, message.from, replyMime));
          break;
        }
      }
    } catch (err) {
      console.error(`[maildrop] Action "${rule.action}" failed:`, err);
    }

    // Persist to D1
    ctx.waitUntil(
      saveEmail(env.DB, {
        from: message.from,
        to: message.to,
        subject: email.subject,
        textPlain: email.textPlain,
        textHtml: email.textHtml,
        rawSize: message.rawSize,
        action: rule.action,
      }),
    );
  },
};

function buildReplyMime(
  replyFrom: string,
  replyTo: string,
  originalSubject: string,
  body: string,
): string {
  const subject = originalSubject.startsWith("Re:")
    ? originalSubject
    : `Re: ${originalSubject}`;
  return [
    `From: ${replyFrom}`,
    `To: ${replyTo}`,
    `Subject: ${subject}`,
    `Message-ID: <maildrop-reply-${Date.now()}@local>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
}
