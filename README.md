# maildrop

Cloudflare Email Worker that processes inbound email — parse, filter, route, and store. Built as a learning project for Cloudflare Workers + Email Routing.

## Architecture

```
Inbound email → Cloudflare MX → Email Routing → Worker "maildrop"
                                                     │
                    ┌────────────────────────────────┤
                    │                                │
              email() handler                  fetch() handler
              ├─ parse MIME (postal-mime)      ├─ GET /           → status
              ├─ match filter rules            ├─ GET /inbox      → list stored emails
              ├─ execute (forward/reply/reject/drop)  └─ GET /inbox/:id  → single email
              └─ save to D1
```

## Project Structure

```
maildrop/
├── src/
│   ├── index.ts          # Worker entry: email() + fetch() handlers
│   ├── filter.ts         # Rule engine: match → action mapping
│   └── storage.ts        # D1 queries: saveEmail, listEmails, getEmail
├── migrations/
│   └── 0001_create_emails.sql
├── wrangler.jsonc        # Cloudflare config + D1 binding
├── generator/            # Scout test data generator
│   └── src/
│       ├── index.ts      # Entry: 5 scenarios × 20 cases = 100 EMLs
│       ├── data.ts       # faker-powered random PO/supplier/line data
│       ├── build.ts      # nodemailer → .eml file
│       ├── validate.ts   # mailparser → structure check
│       ├── send-to-worker.sh  # Batch POST to local wrangler dev
│       └── scenarios/
│           ├── scenario-01.ts  # PO Creation
│           ├── scenario-02.ts  # Full Acknowledgement
│           ├── scenario-03.ts  # Partial Acknowledgement
│           ├── scenario-09.ts  # Exception with Counter Offer
│           └── scenario-10.ts  # Advanced Shipping Notice (ASN)
└── test-emails/          # Manual test fixtures
```

## Filter Rules

Defined in `src/filter.ts`. Evaluated top-to-bottom; first match wins.

| Rule | Match | Action |
|---|---|---|
| Block spam | from contains `spam.example.com` or `mailer-daemon@` | reject (SMTP error) |
| Drop junk | subject contains `sale` or `promo` | drop (silent discard) |
| Auto-reply | subject contains `inquiry` | reply (auto-acknowledge) |
| Forward urgent | subject contains `urgent` or `critical` | forward |
| Default | (none of the above) | accept (store only) |

To forward, replace `FORWARD_TARGET` in `src/filter.ts` with your verified destination address (Cloudflare Dashboard → Email Routing → Destination Addresses).

## Prerequisites

- Node.js 22+
- Cloudflare account + domain on Cloudflare DNS
- Email Routing enabled on the domain

## Quickstart

```bash
npm install
npm run db:setup          # apply D1 migration locally
npm run dev               # start wrangler dev (http://localhost:8787)
```

Send a test email:
```bash
curl -X POST \
  "http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=test@yourdomain.com" \
  -H "Content-Type: message/rfc822" \
  --data-binary @test-email.eml
```

Check results:
```bash
curl http://localhost:8787/inbox | python3 -m json.tool
```

## Deploy

```bash
npx wrangler deploy
npx wrangler d1 migrations apply maildrop-db --remote
```

Then in the Cloudflare Dashboard:
1. Email → Email Routing → enable on your domain
2. Add a Destination Address (your real email) and verify it
3. Create a Routing Rule: custom address → Send to Worker → `maildrop`
4. Enable Catch-all (if desired)

Send a real email to `test@yourdomain.com` and check:
```bash
curl https://maildrop.<your-subdomain>.workers.dev/inbox
```

## Generator (Scout Test Data)

Generator produces randomized EML files matching 5 Scout ticket scenarios.

```bash
cd generator
npm install
npm run generate    # 5 scenarios × 20 cases = 100 .eml files in output/
npm run clean       # remove generated files
```

Batch-test against the local Worker:
```bash
# Terminal 1 (project root)
npm run dev

# Terminal 2 (project root)
bash generator/src/send-to-worker.sh          # all scenarios
bash generator/src/send-to-worker.sh scenario-02  # single scenario
curl http://localhost:8787/inbox
```
