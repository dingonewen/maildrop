/**
 * Build EML files with nodemailer.
 * Each scenario produces a plain text + HTML multipart email
 * that looks like a real supplier/buyer correspondence.
 */
import nodemailer from "nodemailer";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "output");

export interface EmailParts {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Build and write a single .eml file.
 * Returns the file path.
 */
export async function writeEML(
  scenario: string,
  index: number,
  parts: EmailParts,
): Promise<string> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });

  const info = await transporter.sendMail({
    from: parts.from,
    to: parts.to,
    subject: parts.subject,
    text: parts.text,
    html: parts.html,
    headers: {
      "X-Scenario": scenario,
      "X-Index": String(index),
    },
  });

  const raw = info.message.toString();
  const filename = `${scenario}-${String(index).padStart(2, "0")}.eml`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, raw, "utf-8");

  return filepath;
}
