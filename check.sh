#!/usr/bin/env bash
# Checks every market file here against the validator in forest/shapes, then this repo's two
# naming rules: a file lives at <category>/<name>.json, and no two files share a name.
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
const seen = new Map()
let bad = 0
for (const file of process.argv.slice(1)) {
  let market
  try { market = JSON.parse(readFileSync(file, "utf8")) } catch { continue } // the validator said why
  const path = `${market.category}/${market.name}.json`
  if (file !== path) { console.error(`${file}: must live at ${path}`); bad = 1 }
  if (seen.has(market.name)) { console.error(`${file}: name "${market.name}" is already used by ${seen.get(market.name)}`); bad = 1 }
  else seen.set(market.name, file)
}
process.exit(bad)
' "${files[@]}" || failed=1

if [ "$failed" -eq 0 ]; then echo "all ${#files[@]} market files pass"; fi
exit "$failed"
