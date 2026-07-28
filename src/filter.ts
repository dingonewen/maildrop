/**
 * Filter rules for maildrop.
 *
 * Each rule has a match predicate and an action.
 * Rules are evaluated in order; the first match wins.
 * If no rule matches, the default action is "accept" (no-op).
 */

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  textPlain: string;
  textHtml?: string;
}

export type FilterAction = "forward" | "reply" | "reject" | "accept";

export interface FilterRule {
  name: string;
  match: (email: ParsedEmail) => boolean;
  action: FilterAction;
  /** Forward address, reply body text, or reject reason depending on action. */
  target?: string;
}

/**
 * Example filter rules.
 * TODO: replace FORWARD_TARGET with your verified destination address
 * in the Cloudflare Dashboard (Email Routing → Destination Addresses).
 */
const FORWARD_TARGET = "REPLACE_WITH_VERIFIED_ADDRESS";

export const FILTER_RULES: FilterRule[] = [
  {
    name: "Block known spam domain",
    match: (email) =>
      email.from.includes("spam.example.com") ||
      email.from.includes("mailer-daemon@"),
    action: "reject",
    target: "Sender is blocklisted",
  },
  {
    name: "Auto-reply to inquiries",
    match: (email) => {
      const subject = email.subject.toLowerCase();
      return subject.includes("inquiry");
    },
    action: "reply",
    target:
      "We received your inquiry. We will get back to you within 24 hours.",
  },
  {
    name: "Forward urgent messages",
    match: (email) => {
      const subject = email.subject.toLowerCase();
      return subject.includes("urgent") || subject.includes("critical");
    },
    action: "forward",
    target: FORWARD_TARGET,
  },
];

/**
 * Evaluate rules in order. Returns the first matching rule, or an accept fallback.
 */
export function matchRule(
  email: ParsedEmail,
  rules: FilterRule[] = FILTER_RULES,
): FilterRule {
  for (const rule of rules) {
    if (rule.match(email)) {
      return rule;
    }
  }
  return { name: "Default accept", match: () => true, action: "accept" };
}
