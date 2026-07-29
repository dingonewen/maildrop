/**
 * Scenario #10: Advanced Shipping Notice (ASN)
 * Supplier emails that lines have shipped with carrier and tracking info.
 * Scout doc: "turn shipped lines → 'shipped'; if late, draft expedite email"
 */
import type { EmailParts } from "../build";
import type { POData } from "../data";
import { fmtDate } from "../data";
import { faker } from "@faker-js/faker";
import { generatePDF } from "../pdf";

export async function generate(po: POData): Promise<EmailParts> {
  const shipDate = faker.date.recent({ days: 3 });
  const carrier = faker.helpers.arrayElement(["FedEx", "UPS", "DHL", "USPS"]);
  const tracking = `1Z${faker.string.alphanumeric(16).toUpperCase()}`;
  const pieces = po.lines.length;

  const packingHtml = buildPackingHtml(po, shipDate, carrier, tracking);
  const pdfBuffer = await generatePDF(packingHtml);

  const text = [
    `Dear ${po.buyerName},`,
    "",
    `This is a shipping notification for Purchase Order ${po.poNumber}.`,
    "",
    "Shipment Details:",
    `  Ship Date: ${fmtDate(shipDate)}`,
    `  Carrier: ${carrier}`,
    `  Tracking Number: ${tracking}`,
    "",
    "Items Shipped:",
    ...po.lines.map(
      (l, i) =>
        `  ${i + 1}. ${l.partCode} — ${l.partName}: ${l.quantity} units`,
    ),
    "",
    `The shipment is scheduled for delivery within 3-5 business days.`,
    `A packing list PDF is attached for your reference.`,
    "",
    "Please contact us if you have any questions.",
    "",
    "Best regards,",
    po.supplier.contactName,
    po.supplier.name,
    po.supplier.email,
  ].join("\n");

  const html = [
    `<p>Dear ${po.buyerName},</p>`,
    `<p>This is a <strong>shipping notification</strong> for Purchase Order ${po.poNumber}.</p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>Ship Date</th><td>${fmtDate(shipDate)}</td></tr>`,
    `<tr><th>Carrier</th><td>${carrier}</td></tr>`,
    `<tr><th>Tracking Number</th><td><strong>${tracking}</strong></td></tr>`,
    `</table>`,
    `<p><strong>Items Shipped:</strong></p>`,
    `<table border="1" cellpadding="4" style="border-collapse:collapse;">`,
    `<tr><th>#</th><th>Part Code</th><th>Part Name</th><th>Qty</th></tr>`,
    ...po.lines.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${l.partCode}</td><td>${l.partName}</td><td>${l.quantity}</td></tr>`,
    ),
    `</table>`,
    `<p>The shipment is scheduled for delivery within 3-5 business days.</p>`,
    `<p>A packing list PDF is attached for your reference.</p>`,
    `<p>Best regards,<br>${po.supplier.contactName}<br>${po.supplier.name}<br><a href="mailto:${po.supplier.email}">${po.supplier.email}</a></p>`,
  ].join("\n");

  return {
    from: po.supplier.email,
    to: po.buyerEmail,
    subject: `Shipping Notification for PO ${po.poNumber} — Tracking ${tracking}`,
    text,
    html,
    attachments: [
      {
        filename: `PackingList_${po.poNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

function buildPackingHtml(
  po: POData,
  shipDate: Date,
  carrier: string,
  tracking: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 22px; letter-spacing: 2px; margin: 0; }
    .header .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                   border-bottom: 2px solid #1a1a1a; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; font-size: 13px; text-align: left; }
    th { background: #f5f5f5; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid .label { color: #666; font-size: 11px; text-transform: uppercase; }
    .grid .value { font-size: 14px; }
    .footer { margin-top: 36px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PACKING LIST</h1>
    <div class="subtitle">PO ${po.poNumber}</div>
  </div>
  <div class="section">
    <h2>Shipment Details</h2>
    <div class="grid">
      <div><span class="label">Ship Date</span><br><span class="value">${fmtDate(shipDate)}</span></div>
      <div><span class="label">Carrier</span><br><span class="value">${carrier}</span></div>
      <div><span class="label">Tracking</span><br><span class="value">${tracking}</span></div>
      <div><span class="label">Supplier</span><br><span class="value">${po.supplier.name}</span></div>
    </div>
  </div>
  <div class="section">
    <h2>Shipped Items</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Part Code</th><th>Description</th><th>Qty</th></tr>
      </thead>
      <tbody>
        ${po.lines.map((l, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${l.partCode}</td>
          <td>${l.partName}</td>
          <td>${l.quantity}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Recipient</h2>
    <div class="grid">
      <div><span class="label">Buyer</span><br><span class="value">${po.buyerName}</span></div>
      <div><span class="label">Email</span><br><span class="value">${po.buyerEmail}</span></div>
    </div>
  </div>
  <div class="footer">
    Total Pieces: ${po.lines.length} &middot; If any items are missing or damaged, notify us within 48 hours.
  </div>
</body>
</html>`;
}
