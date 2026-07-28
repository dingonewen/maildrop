/**
 * Unit tests for filter rule matching logic.
 *
 * This tests the pure logic without going through wrangler dev / miniflare,
 * avoiding miniflare email-parsing bugs with certain subject keywords.
 * Run with: npx vitest run
 */

import { describe, it, expect } from "vitest";
import { matchRule, FILTER_RULES, type ParsedEmail } from "../src/filter";

function makeEmail(overrides: Partial<ParsedEmail> = {}): ParsedEmail {
  return {
    from: "sender@example.com",
    to: "test@yourdomain.com",
    subject: "Hello from maildrop",
    textPlain: "Test body.",
    ...overrides,
  };
}

describe("matchRule", () => {
  it("accepts normal email (no rules match)", () => {
    const rule = matchRule(makeEmail());
    expect(rule.action).toBe("accept");
  });

  it("rejects emails from spam.example.com", () => {
    const rule = matchRule(
      makeEmail({ from: "bad-actor@spam.example.com" }),
    );
    expect(rule.action).toBe("reject");
    expect(rule.target).toContain("blocklisted");
  });

  it("rejects emails from mailer-daemon", () => {
    const rule = matchRule(
      makeEmail({ from: "mailer-daemon@gmail.com" }),
    );
    expect(rule.action).toBe("reject");
  });

  it("auto-replies to inquiry emails", () => {
    const rule = matchRule(
      makeEmail({ subject: "Inquiry about your product" }),
    );
    expect(rule.action).toBe("reply");
    expect(rule.target).toContain("24 hours");
  });

  it("auto-replies when inquiry is anywhere in subject", () => {
    const rule = matchRule(
      makeEmail({ subject: "I have an inquiry regarding billing" }),
    );
    expect(rule.action).toBe("reply");
  });

  it("forwards urgent emails", () => {
    const rule = matchRule(
      makeEmail({ subject: "URGENT: Server is down" }),
    );
    expect(rule.action).toBe("forward");
  });

  it("forwards critical emails", () => {
    const rule = matchRule(
      makeEmail({ subject: "CRITICAL security issue" }),
    );
    expect(rule.action).toBe("forward");
  });

  it("first matching rule wins (spam before inquiry)", () => {
    const rule = matchRule(
      makeEmail({
        from: "bad-actor@spam.example.com",
        subject: "Inquiry about your product",
      }),
    );
    // Spam rule is listed first, so it should match before inquiry rule
    expect(rule.action).toBe("reject");
  });

  it("custom rules override defaults", () => {
    const customRules = [
      {
        name: "Reject all",
        match: () => true,
        action: "reject" as const,
        target: "Nope",
      },
    ];
    const rule = matchRule(makeEmail(), customRules);
    expect(rule.action).toBe("reject");
  });
});
