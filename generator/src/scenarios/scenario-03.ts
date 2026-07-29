/**
 * Scenario #3: Partial PO Acknowledgement
 * Supplier confirms some lines, needs to check others.
 * Scout doc: "confirmed lines → acknowledged; unconfirmed stay unacknowledged"
 */
import type { EmailParts } from "../build";
import type { POData } from "../data";
import { fmtDate, computeTotal, fmtCurrency } from "../data";

export function generate(po: POData): EmailParts {
  // Split lines into confirmed and unconfirmed
  const split = Math.max(1, Math.floor(po.lines.length / 2));
  const confirmed = po.lines.slice(0, split);
  const unconfirmed = po.lines.slice(split);

  const formatLines = (lines: typeof po.lines, status: string) =>
    lines.map(
      (l, i) =>
        `  ${i + 1}. ${l.partCode} — ${l.partName}: ${l.quantity} units, Need-by ${fmtDate(l.needByDate)} — ${status}`,
    );

  const text = [
    `Dear ${po.buyerName},`,
    "",
    `Thank you for Purchase Order ${po.poNumber}. We have reviewed the order`,
    `and can confirm the following lines:`,
    "",
    ...formatLines(confirmed, "CONFIRMED"),
    "",
    `However, we need additional time to verify the following lines:`,
    "",
    ...formatLines(unconfirmed, "PENDING — will confirm by end of week"),
    "",
    `Confirmed Lines Total: ${fmtCurrency(confirmed.reduce((s, l) => s + l.quantity * l.unitPrice, 0))}`,
    `Unconfirmed Lines Total: ${fmtCurrency(unconfirmed.reduce((s, l) => s + l.quantity * l.unitPrice, 0))}`,
    "",
    "We will send an update as soon as the remaining lines are reviewed.",
    "",
    "Best regards,",
    po.supplier.contactName,
    po.supplier.name,
    po.supplier.email,
  ].join("\n");

  const html = [
    `<p>Dear ${po.buyerName},</p>`,
    `<p>Thank you for <strong>Purchase Order ${po.poNumber}</strong>. We have reviewed the order`,
    `and can confirm the following lines:</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>#</th><th>Part Code</th><th>Part Name</th><th>Qty</th><th>Need-by</th><th>Status</th></tr>`,
    ...confirmed.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${l.partCode}</td><td>${l.partName}</td><td>${l.quantity}</td><td>${fmtDate(l.needByDate)}</td><td style="color:green;"><strong>CONFIRMED</strong></td></tr>`,
    ),
    `</table>`,
    `<p>However, we need additional time to verify the following lines:</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>#</th><th>Part Code</th><th>Part Name</th><th>Qty</th><th>Need-by</th><th>Status</th></tr>`,
    ...unconfirmed.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${l.partCode}</td><td>${l.partName}</td><td>${l.quantity}</td><td>${fmtDate(l.needByDate)}</td><td style="color:orange;"><strong>PENDING</strong></td></tr>`,
    ),
    `</table>`,
    `<p>We will send an update as soon as the remaining lines are reviewed.</p>`,
    `<p>Best regards,<br>${po.supplier.contactName}<br>${po.supplier.name}<br><a href="mailto:${po.supplier.email}">${po.supplier.email}</a></p>`,
  ].join("\n");

  return {
    from: po.supplier.email,
    to: po.buyerEmail,
    subject: `Re: Purchase Order ${po.poNumber} — Partial Acknowledgement`,
    text,
    html,
  };
}
