/**
 * Random data generation for email test cases.
 * Uses faker to produce realistic but fake supplier, PO, and line-item data.
 */
import { faker } from "@faker-js/faker";

export interface Supplier {
  name: string;
  email: string;
  contactName: string;
}

export interface LineItem {
  partCode: string;
  partName: string;
  partSpec: string;
  quantity: number;
  unitPrice: number;
  needByDate: Date;
}

export interface POData {
  poNumber: string;
  supplier: Supplier;
  buyerName: string;
  buyerEmail: string;
  creationDate: Date;
  totalValue: number;
  lines: LineItem[];
}

export function makeSupplier(): Supplier {
  faker.seed();
  return {
    name: faker.company.name(),
    email: faker.internet.email(),
    contactName: faker.person.fullName(),
  };
}

export function makeLineItem(): LineItem {
  return {
    partCode: `PART-${faker.string.alphanumeric(6).toUpperCase()}`,
    partName: faker.commerce.productName(),
    partSpec: faker.helpers.arrayElement([
      "Stainless Steel 304",
      "Aluminum 6061-T6",
      "Copper C110",
      "Nylon 6/6",
      "Carbon Fiber",
      "Titanium Grade 5",
      "ABS Plastic",
      "Brass C360",
    ]),
    quantity: faker.number.int({ min: 10, max: 5000 }),
    unitPrice: parseFloat(faker.commerce.price({ min: 0.5, max: 500 })),
    needByDate: faker.date.future(),
  };
}

export function makePOData(lines: number = faker.number.int({ min: 1, max: 5 })): POData {
  return {
    poNumber: `PO-${faker.string.alphanumeric(8).toUpperCase()}`,
    supplier: makeSupplier(),
    buyerName: faker.person.fullName(),
    buyerEmail: faker.internet.email(),
    creationDate: faker.date.recent({ days: 30 }),
    totalValue: 0, // computed below
    lines: Array.from({ length: lines }, makeLineItem),
  };
}

/** Compute total value from lines. */
export function computeTotal(po: POData): number {
  return po.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}

/** Format a date like "July 28, 2026". */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format currency. */
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
