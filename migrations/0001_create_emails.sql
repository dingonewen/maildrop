-- Create the emails table for inbound mail storage.
CREATE TABLE IF NOT EXISTS emails (
  id          TEXT PRIMARY KEY,
  "from"      TEXT NOT NULL,
  "to"        TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '(no subject)',
  text_plain  TEXT NOT NULL DEFAULT '',
  text_html   TEXT,
  raw_size    INTEGER NOT NULL DEFAULT 0,
  action      TEXT NOT NULL DEFAULT 'accept',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails("from");
