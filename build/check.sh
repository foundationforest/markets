#!/usr/bin/env bash
# Checks the markets and writes the directory:
#   1. every markets/*.json against build/market.schema.json, each field's type against
#      build/types.json (in listing and review), each role's word once per market, each field's roles
#      among the market's roles, each label for one of its field's values, each when naming choice
#      fields of the same entry and values of them, never for a role the named field is not for, and
#      never in a loop, and each name in preview one of the market's listing fields; and the
#      schema's lists of types, of units and of the names every listing and every review holds the
#      same as build/types.json's and the package's (src/markets.ts);
#   2. each market's name equal to its file's name, which also keeps every name unique;
#   3. against a commit, origin/main or the one the first argument names: each market live there only
#      grows, so whatever was posted in it still fits and every profile stays what it is, the types
#      in build/types.json it uses stay as they are but for their descriptions, and a market not
#      there starts as beta. With no such commit it says so and compares nothing, except in CI,
#      where it fails;
#   4. when every market passes, directory.json and directory.md as the market files write them,
#      sorted by name: when either is stale, rewrites it and fails, so the new copy gets committed.
#      Nobody edits either by hand.
# The check itself is scripts/check.ts. Needs Node 22.18 or later, npm and git; installs the locked
# packages into build/node_modules on first run. Exit 0 when everything passes, 1 when anything
# fails.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! node_modules/.package-lock.json -nt package-lock.json ]; then
  npm ci --silent --no-audit --no-fund
fi

# The markets and types at the commit compared with, copied out of git, as check.ts reads them.
against=${1:-origin/main}
main=""
if git -C .. rev-parse --verify --quiet "$against^{commit}" >/dev/null 2>&1; then
  copy=$(mktemp -d)
  trap 'rm -rf "$copy"' EXIT
  mkdir -p "$copy/markets" "$copy/build"
  git -C .. ls-tree -r --name-only "$against" -- markets build/types.json |
    { grep -E '^(markets/[^/]+\.json|build/types\.json)$' || true; } |
    while read -r path; do git -C .. show "$against:$path" >"$copy/$path"; done
  echo "comparing live markets with $against ($(git -C .. rev-parse --short "$against^{commit}"))"
  main=$copy
elif [ -n "${CI:-}" ]; then
  echo "$against is not a commit here, and CI must compare live markets with one" >&2
  exit 1
else
  echo "$against is not a commit here: live markets are not compared"
fi

node --disable-warning=ExperimentalWarning scripts/check.ts .. ${main:+"$main"}
