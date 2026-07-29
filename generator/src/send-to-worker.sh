#!/bin/bash
# Batch-send generated EML files to the local wrangler dev Worker.
# Usage: bash send-all.sh [scenario-name]  (omit arg to send all)
set -e

WORKER_URL="http://localhost:8787/cdn-cgi/handler/email"
FROM="test@example.com"
TO="test@dingonewen.dev"
PATTERN="${1:-scenario-*}"

for eml in output/$PATTERN-*.eml; do
  echo -n "$(basename "$eml") ... "
  RESP=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$WORKER_URL?from=$FROM&to=$TO" \
    -H "Content-Type: message/rfc822" \
    --data-binary @"$eml")
  echo "HTTP $RESP"
done
echo "Done. Check: curl http://localhost:8787/inbox"
