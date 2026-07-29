/**
 * PDF generation via Gotenberg.
 * Requires: docker run -d --name gotenberg -p 3000:3000 gotenberg/gotenberg:8
 */

const GOTENBERG_URL = "http://localhost:3000";

export async function generatePDF(html: string): Promise<Buffer> {
  const form = new FormData();
  const htmlBytes = new TextEncoder().encode(html);
  // Node 22 globals — TS may not know Blob at compile time
  const BlobCtor = (globalThis as any).Blob as typeof Blob;
  form.append("files", new BlobCtor([htmlBytes], { type: "text/html" }), "index.html");

  const response = await fetch(
    `${GOTENBERG_URL}/forms/chromium/convert/html`,
    { method: "POST", body: form },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gotenberg returned ${response.status}: ${text}`);
  }

  const buf = await response.arrayBuffer();
  return Buffer.from(buf);
}
