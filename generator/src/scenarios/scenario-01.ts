/**
 * Scenario #1: PO Creation
 * ERP sends out a new PO email to the supplier.
 * Scout doc: "sets owner, seeds subscribers"
 */
import type { EmailParts } from "../build";
import { type POData, fmtDate, fmtCurrency, computeTotal } from "../data";
import { generatePDF } from "../pdf";

export async function generate(po: POData): Promise<EmailParts> {
  const total = computeTotal(po);

  const poHtml = buildPOHtml(po, total);
  const pdfBuffer = await generatePDF(poHtml);

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
        filename: `${po.poNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

function buildPOHtml(po: POData, total: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; letter-spacing: 2px; margin: 0; }
    .header .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                   border-bottom: 2px solid #1a1a1a; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; font-size: 13px; text-align: left; }
    th { background: #f5f5f5; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
    td.right { text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid .label { color: #666; font-size: 11px; text-transform: uppercase; }
    .grid .value { font-size: 14px; }
    .footer { margin-top: 36px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PURCHASE ORDER</h1>
    <div class="subtitle">${po.poNumber} &mdash; ${fmtDate(po.creationDate)}</div>
  </div>
  <div class="section">
    <h2>Buyer</h2>
    <div class="grid">
      <div><span class="label">Name</span><br><span class="value">${po.buyerName}</span></div>
      <div><span class="label">Email</span><br><span class="value">${po.buyerEmail}</span></div>
    </div>
  </div>
  <div class="section">
    <h2>Supplier</h2>
    <div class="grid">
      <div><span class="label">Company</span><br><span class="value">${po.supplier.name}</span></div>
      <div><span class="label">Contact</span><br><span class="value">${po.supplier.contactName}</span></div>
      <div><span class="label">Email</span><br><span class="value">${po.supplier.email}</span></div>
    </div>
  </div>
  <div class="section">
    <h2>Line Items</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Part Code</th><th>Description</th><th>Spec</th><th>Qty</th><th>Unit Price</th><th>Need-by</th><th class="right">Total</th></tr>
      </thead>
      <tbody>
        ${po.lines.map((l, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${l.partCode}</td>
          <td>${l.partName}</td>
          <td>${l.partSpec}</td>
          <td>${l.quantity}</td>
          <td>${fmtCurrency(l.unitPrice)}</td>
          <td>${fmtDate(l.needByDate)}</td>
          <td class="right">${fmtCurrency(l.quantity * l.unitPrice)}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot>
        <tr><td colspan="7" style="text-align:right;font-weight:bold;">TOTAL</td><td class="right" style="font-weight:bold;">${fmtCurrency(total)}</td></tr>
      </tfoot>
    </table>
  </div>
  <div class="footer">
    Payment Terms: Net 30 &middot; Shipping: FOB Origin &middot; Please acknowledge within 48 hours
  </div>
</body>
</html>`;
}
