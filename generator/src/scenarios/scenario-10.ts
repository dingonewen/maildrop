/**
 * Scenario #10: Advanced Shipping Notice (ASN)
 * Supplier emails that lines have shipped with carrier and tracking info.
 * Scout doc: "turn shipped lines → 'shipped'; if late, draft expedite email"
 */
import type { EmailParts } from "../build";
import type { POData } from "../data";
import { fmtDate } from "../data";
import { faker } from "@faker-js/faker";

export function generate(po: POData): EmailParts {
  const shipDate = faker.date.recent({ days: 3 });
  const carrier = faker.helpers.arrayElement([
    "FedEx",
    "UPS",
    "DHL",
    "USPS",
  ]);
  const tracking = `1Z${faker.string.alphanumeric(16).toUpperCase()}`;

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
    `A packing list is attached for your reference.`,
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
    `<p>A packing list is attached for your reference.</p>`,
    `<p>Best regards,<br>${po.supplier.contactName}<br>${po.supplier.name}<br><a href="mailto:${po.supplier.email}">${po.supplier.email}</a></p>`,
  ].join("\n");

  return {
    from: po.supplier.email,
    to: po.buyerEmail,
    subject: `Shipping Notification for PO ${po.poNumber} — Tracking ${tracking}`,
    text,
    html,
  };
}
