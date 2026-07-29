/**
 * Scenario #1: PO Creation
 * ERP sends out a new PO email to the supplier.
 * Scout doc: "sets owner, seeds subscribers"
 *
 * Includes CC (buyer team, seeds subscribers in Scout) and a PO attachment.
 */
import type { EmailParts } from "../build";
import { type POData, fmtDate, fmtCurrency, computeTotal } from "../data";

export function generate(po: POData): EmailParts {
  const total = computeTotal(po);

  const poAttachment = [
    "PURCHASE ORDER",
    `${"=".repeat(40)}`,
    "",
    `PO Number:      ${po.poNumber}`,
    `Date:           ${fmtDate(po.creationDate)}`,
    "",
    `Buyer:          ${po.buyerName}`,
    `Buyer Email:    ${po.buyerEmail}`,
    "",
    `Supplier:       ${po.supplier.name}`,
    `Contact:        ${po.supplier.contactName}`,
    `Supplier Email: ${po.supplier.email}`,
    "",
    `${"=".repeat(40)}`,
    "LINE ITEMS",
    `${"=".repeat(40)}`,
    "",
    ...po.lines.flatMap((l, i) => [
      `Line ${i + 1}: ${l.partName}`,
      `  Part Code:    ${l.partCode}`,
      `  Specification: ${l.partSpec}`,
      `  Quantity:     ${l.quantity} units`,
      `  Unit Price:   ${fmtCurrency(l.unitPrice)}`,
      `  Need-by Date: ${fmtDate(l.needByDate)}`,
      `  Line Total:   ${fmtCurrency(l.quantity * l.unitPrice)}`,
      "",
    ]),
    `${"-".repeat(40)}`,
    `TOTAL:          ${fmtCurrency(total)}`,
    "",
    `${"=".repeat(40)}`,
    "TERMS",
    `${"=".repeat(40)}`,
    "",
    "Payment Terms:  Net 30",
    "Shipping:       FOB Origin",
    "Delivery:       Per line item need-by dates",
    "",
    "Please acknowledge receipt of this Purchase Order within 48 hours.",
  ].join("\n");

  const text = [
    `Dear ${po.supplier.contactName},`,
    "",
    `Please find attached Purchase Order ${po.poNumber}, dated ${fmtDate(po.creationDate)}.`,
    `A PDF copy is attached for your records.`,
    "",
    `Supplier: ${po.supplier.name}`,
    `Total Value: ${fmtCurrency(total)}`,
    `Number of Line Items: ${po.lines.length}`,
    "",
    "Line Item Details:",
    ...po.lines.map(
      (l, i) =>
        `  ${i + 1}. ${l.partName} (${l.partCode}) — ${l.quantity} units @ ${fmtCurrency(l.unitPrice)} each, Need-by: ${fmtDate(l.needByDate)}`,
    ),
    "",
    "Please confirm receipt and acknowledge this PO at your earliest convenience.",
    "",
    "Best regards,",
    po.buyerName,
    po.buyerEmail,
  ].join("\n");

  const html = [
    `<p>Dear ${po.supplier.contactName},</p>`,
    `<p>Please find attached <strong>Purchase Order ${po.poNumber}</strong>, dated ${fmtDate(po.creationDate)}.</p>`,
    `<p>A PDF copy is attached for your records.</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>Supplier</th><td>${po.supplier.name}</td></tr>`,
    `<tr><th>Total Value</th><td>${fmtCurrency(total)}</td></tr>`,
    `<tr><th>Line Items</th><td>${po.lines.length}</td></tr>`,
    `</table>`,
    `<p><strong>Line Item Details:</strong></p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>#</th><th>Part</th><th>Code</th><th>Qty</th><th>Unit Price</th><th>Need-by</th></tr>`,
    ...po.lines.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${l.partName}</td><td>${l.partCode}</td><td>${l.quantity}</td><td>${fmtCurrency(l.unitPrice)}</td><td>${fmtDate(l.needByDate)}</td></tr>`,
    ),
    `</table>`,
    `<p>Please confirm receipt and acknowledge this PO at your earliest convenience.</p>`,
    `<p>Best regards,<br>${po.buyerName}<br><a href="mailto:${po.buyerEmail}">${po.buyerEmail}</a></p>`,
  ].join("\n");

  return {
    from: po.buyerEmail,
    to: po.supplier.email,
    cc: po.ccTeam,
    subject: `Purchase Order ${po.poNumber} from ${po.buyerName}`,
    text,
    html,
    attachments: [
      {
        filename: `${po.poNumber}.txt`,
        content: poAttachment,
        contentType: "text/plain",
      },
    ],
  };
}
