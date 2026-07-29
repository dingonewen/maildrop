/**
 * Scenario #2: Full PO Acknowledgement
 * Supplier confirms they can ship everything by the need-by dates.
 * Scout doc: "Turn a PO and all of its lines into 'acknowledged'"
 */
import type { EmailParts } from "../build";
import type { POData } from "../data";
import { fmtDate, computeTotal, fmtCurrency } from "../data";

export function generate(po: POData): EmailParts {
  const text = [
    `Dear ${po.buyerName},`,
    "",
    `We have received Purchase Order ${po.poNumber} and are pleased to confirm`,
    `that we can fulfill the entire order by the requested need-by dates.`,
    "",
    `Order Summary:`,
    ...po.lines.map(
      (l, i) =>
        `  ${i + 1}. ${l.partCode} — ${l.partName}: ${l.quantity} units, Need-by ${fmtDate(l.needByDate)} — CONFIRMED`,
    ),
    "",
    `Total Order Value: ${fmtCurrency(computeTotal(po))}`,
    "",
    "We will keep you updated on the production and shipping schedule.",
    "",
    "Best regards,",
    po.supplier.contactName,
    po.supplier.name,
    po.supplier.email,
  ].join("\n");

  const html = [
    `<p>Dear ${po.buyerName},</p>`,
    `<p>We have received <strong>Purchase Order ${po.poNumber}</strong> and are pleased to confirm`,
    `that we can <strong>fulfill the entire order</strong> by the requested need-by dates.</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>#</th><th>Part Code</th><th>Part Name</th><th>Qty</th><th>Need-by</th><th>Status</th></tr>`,
    ...po.lines.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${l.partCode}</td><td>${l.partName}</td><td>${l.quantity}</td><td>${fmtDate(l.needByDate)}</td><td style="color:green;"><strong>CONFIRMED</strong></td></tr>`,
    ),
    `</table>`,
    `<p><strong>Total Order Value:</strong> ${fmtCurrency(computeTotal(po))}</p>`,
    `<p>We will keep you updated on the production and shipping schedule.</p>`,
    `<p>Best regards,<br>${po.supplier.contactName}<br>${po.supplier.name}<br><a href="mailto:${po.supplier.email}">${po.supplier.email}</a></p>`,
  ].join("\n");

  return {
    from: po.supplier.email,
    to: po.buyerEmail,
    subject: `Re: Purchase Order ${po.poNumber} — Full Acknowledgement`,
    text,
    html,
  };
}
