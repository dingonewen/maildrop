/**
 * Scenario #9: PO Exception with Counter Offer
 * Supplier can no longer meet acknowledged terms, proposes alternative.
 * Scout doc: "accept counter → [send, todo, edit]; hold → [send, edit]"
 */
import type { EmailParts } from "../build";
import type { POData, LineItem } from "../data";
import { fmtDate, fmtCurrency } from "../data";

export function generate(po: POData): EmailParts {
  // Pick one line to raise an exception on
  const exceptionLine: LineItem =
    po.lines[fakerSeed() % po.lines.length];
  const newDate = new Date(exceptionLine.needByDate);
  newDate.setDate(newDate.getDate() + 14); // two weeks later

  const text = [
    `Dear ${po.buyerName},`,
    "",
    `I am writing regarding Purchase Order ${po.poNumber}, which we acknowledged previously.`,
    "",
    `Unfortunately, we have encountered a production delay affecting the following line:`,
    "",
    `  Part: ${exceptionLine.partName} (${exceptionLine.partCode})`,
    `  Original Need-by Date: ${fmtDate(exceptionLine.needByDate)}`,
    `  Proposed New Date: ${fmtDate(newDate)}`,
    `  Quantity: ${exceptionLine.quantity} units @ ${fmtCurrency(exceptionLine.unitPrice)} each`,
    "",
    `Reason: Raw material shipment from our upstream supplier was delayed`,
    `by approximately two weeks due to logistics issues.`,
    "",
    `We are asking if you can accept this revised delivery date.`,
    `All other lines on PO ${po.poNumber} remain on track.`,
    "",
    "Please let us know how you would like to proceed.",
    "",
    "Best regards,",
    po.supplier.contactName,
    po.supplier.name,
    po.supplier.email,
  ].join("\n");

  const html = [
    `<p>Dear ${po.buyerName},</p>`,
    `<p>I am writing regarding <strong>Purchase Order ${po.poNumber}</strong>, which we acknowledged previously.</p>`,
    `<p>Unfortunately, we have encountered a <strong style="color:red;">production delay</strong> affecting the following line:</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>Part</th><td>${exceptionLine.partName} (${exceptionLine.partCode})</td></tr>`,
    `<tr><th>Original Need-by</th><td>${fmtDate(exceptionLine.needByDate)}</td></tr>`,
    `<tr><th>Proposed New Date</th><td style="color:orange;"><strong>${fmtDate(newDate)}</strong></td></tr>`,
    `<tr><th>Quantity</th><td>${exceptionLine.quantity} units @ ${fmtCurrency(exceptionLine.unitPrice)}</td></tr>`,
    `</table>`,
    `<p><strong>Reason:</strong> Raw material shipment from our upstream supplier was delayed`,
    `by approximately two weeks due to logistics issues.</p>`,
    `<p>We are asking if you can accept this revised delivery date.`,
    `All other lines on PO ${po.poNumber} remain on track.</p>`,
    `<p>Please let us know how you would like to proceed.</p>`,
    `<p>Best regards,<br>${po.supplier.contactName}<br>${po.supplier.name}<br><a href="mailto:${po.supplier.email}">${po.supplier.email}</a></p>`,
  ].join("\n");

  return {
    from: po.supplier.email,
    to: po.buyerEmail,
    subject: `Exception on PO ${po.poNumber} — Revised Delivery Date Proposed`,
    text,
    html,
  };
}

function fakerSeed(): number {
  return Math.floor(Math.random() * 100);
}
