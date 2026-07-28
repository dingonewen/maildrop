/**
 * maildrop — Cloudflare Email Worker
 *
 * Stage 1: Minimal email handler. Logs incoming mail and accepts it.
 * Test locally with:
 *   npx wrangler dev
 *   curl -X POST "http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=test@yourdomain.com" \
 *     -H "Content-Type: message/rfc822" \
 *     --data-binary @test-email.eml
 */

export default {
  // fetch() is required by wrangler dev even for email-only Workers.
  // It will serve the HTTP API / dashboard in later stages.
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
    console.log(`[maildrop] Subject: ${message.headers.get("subject")}`);
    console.log(`[maildrop] Size: ${message.rawSize} bytes`);

    // For now, accept the mail without forwarding.
    // Forwarding requires a verified destination address in Cloudflare Dashboard.
    console.log("[maildrop] Accepted (no forward target configured yet)");
  },
};
