/**
 * D1 storage layer for maildrop.
 * Inbound emails are persisted to D1 so they can be queried by the HTTP API.
 */

export interface StoredEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  textPlain: string;
  textHtml: string | null;
  rawSize: number;
  action: string;
  createdAt: string;
}

export async function saveEmail(
  db: D1Database,
  email: {
    from: string;
    to: string;
    subject: string;
    textPlain: string;
    textHtml?: string;
    rawSize: number;
    action: string;
  },
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO emails (id, "from", "to", subject, text_plain, text_html, raw_size, action)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(id, email.from, email.to, email.subject, email.textPlain, email.textHtml ?? null, email.rawSize, email.action)
    .run();
}

export async function listEmails(
  db: D1Database,
  limit = 20,
): Promise<StoredEmail[]> {
  const result = await db
    .prepare(
      `SELECT id, "from", "to", subject, text_plain AS textPlain,
              text_html AS textHtml, raw_size AS rawSize, action, created_at AS createdAt
       FROM emails
       ORDER BY created_at DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<StoredEmail>();
  return result.results;
}

export async function getEmail(
  db: D1Database,
  id: string,
): Promise<StoredEmail | null> {
  const result = await db
    .prepare(
      `SELECT id, "from", "to", subject, text_plain AS textPlain,
              text_html AS textHtml, raw_size AS rawSize, action, created_at AS createdAt
       FROM emails
       WHERE id = ?1`,
    )
    .bind(id)
    .first<StoredEmail>();
  return result ?? null;
}
