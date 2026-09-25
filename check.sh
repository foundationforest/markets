#!/usr/bin/env bash
# Checks every market file here against the validator in forest/shapes (main), then that the name
# isn't already here: each file lives at <category>/<name>.json, no two files share a name, and no
# file takes a name listed as an alias in directory.md's Aliases table.
# Needs git, Node 22 and npm. Exit 0 when every file passes, 1 when any fails.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git clone --quiet --depth 1 https://github.com/foundationforest/forest.git "$work/forest"
(cd "$work/forest/shapes" && npm ci --silent --no-audit --no-fund)
validate="$work/forest/shapes/bin/validate.js"

cd "$here"
shopt -s nullglob
files=(*/*.json)
failed=0

for file in "${files[@]}"; do
  node "$validate" market "$file" || failed=1
done

node -e '
const { readFileSync } = require("node:fs")
// Aliases: rows of the table under "## Aliases", each "| `market` | `alias`, `alias` |".
const aliasOf = new Map()
const aliases = (readFileSync("directory.md", "utf8").split(/^## Aliases *$/m)[1] ?? "").split(/^## /m)[0]
for (const row of aliases.split("\n")) {
  const cells = row.split("|").slice(1, -1)
  const listed = cells[0]?.match(/`([^`]+)`/)?.[1]
  if (!listed || cells.length < 2) continue // not a row, or the header and its rule
  for (const [, alias] of cells[1].matchAll(/`([^`]+)`/g)) aliasOf.set(alias, listed)
}
const seen = new Map()
let bad = 0
for (const file of process.argv.slice(1)) {
  let market
  try { market = JSON.parse(readFileSync(file, "utf8")) } catch { continue } // the validator said why
  const path = `${market.category}/${market.name}.json`
  if (file !== path) { console.error(`${file}: must live at ${path}`); bad = 1 }
  if (seen.has(market.name)) { console.error(`${file}: name "${market.name}" is already used by ${seen.get(market.name)}`); bad = 1 }
  else seen.set(market.name, file)
  if (aliasOf.has(market.name)) { console.error(`${file}: name "${market.name}" is listed as an alias of ${aliasOf.get(market.name)} in directory.md`); bad = 1 }
}
process.exit(bad)
' "${files[@]}" || failed=1

if [ "$failed" -eq 0 ]; then echo "all ${#files[@]} market files pass"; fi
exit "$failed"
