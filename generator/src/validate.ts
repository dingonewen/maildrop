/**
 * Validate generated EML files with mailparser.
 * Checks that key fields are populated and the structure is sound.
 */
import { simpleParser } from "mailparser";
import { readFileSync } from "fs";

export interface ValidationResult {
  file: string;
  ok: boolean;
  errors: string[];
}

export async function validateEML(filepath: string): Promise<ValidationResult> {
  const raw = readFileSync(filepath, "utf-8");
  const errors: string[] = [];

  let parsed;
  try {
    parsed = await simpleParser(raw);
  } catch (err) {
    return { file: filepath, ok: false, errors: [`Parse error: ${err}`] };
  }

  if (!parsed.from) errors.push("missing from");
  if (!parsed.to) errors.push("missing to");
  if (!parsed.subject) errors.push("missing subject");
  if (!parsed.text && !parsed.html) errors.push("no body content");
  if (!parsed.messageId) errors.push("missing Message-ID");
  if (!parsed.date) errors.push("missing Date");

  return {
    file: filepath,
    ok: errors.length === 0,
    errors,
  };
}
