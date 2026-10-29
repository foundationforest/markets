#!/usr/bin/env bash
# Checks the markets and writes the directory:
#   1. every markets/*.json against build/market.schema.json, each field's type against
#      build/types.json (in post and review), each role's word once per market, each field's roles
#      among the market's roles, and each name in preview one of the market's post fields; and the
#      schema's lists of types and of the names every review holds the same as build/types.json's
#      and the package's (src/index.ts);
#   2. each market's name equal to its file's name, which also keeps every name unique;
#   3. when every market passes, directory.json and directory.md as the market files write them,
#      sorted by name: when either is stale, rewrites it and fails, so the new copy gets committed.
#      Nobody edits either by hand.
# The check itself is scripts/check.ts. Needs Node 22.18 or later and npm; installs the locked
# packages into build/node_modules on first run. Exit 0 when everything passes, 1 when anything
# fails.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! node_modules/.package-lock.json -nt package-lock.json ]; then
  npm ci --silent --no-audit --no-fund
fi

node --disable-warning=ExperimentalWarning scripts/check.ts
