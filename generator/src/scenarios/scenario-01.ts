/**
 * Scenario #1: PO Creation
 * ERP sends out a new PO email to the supplier.
 * Scout doc: "sets owner, seeds subscribers"
 */
import type { EmailParts } from "../build";
import { type POData, fmtDate, fmtCurrency, computeTotal } from "../data";

export function generate(po: POData): EmailParts {
  const total = computeTotal(po);

  const text = [
    `Dear ${po.supplier.contactName},`,
    "",
    `Please find attached Purchase Order ${po.poNumber}, dated ${fmtDate(po.creationDate)}.`,
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
    subject: `Purchase Order ${po.poNumber} from ${po.buyerName}`,
    text,
    html,
  };
}
