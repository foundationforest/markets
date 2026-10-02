#!/usr/bin/env bash
# Checks every market file here (<folder>/<name>.json; schema/ is not a folder of markets):
#   1. against schema/market.json;
#   2. the file sits at <folder>/<name>.json, with its own folder and name;
#   3. no two files share a name;
#   4. directory.md has a line for it, and every line there points at a market file of that name.
# Needs Node 22 and npm; installs the locked validator (ajv) into node_modules/ on first run.
# Exit 0 when everything passes, 1 when anything fails.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! node_modules/.package-lock.json -nt package-lock.json ]; then
  npm ci --silent --no-audit --no-fund
fi

shopt -s nullglob
files=()
for file in */*.json; do
  case "$file" in schema/* | node_modules/*) ;; *) files+=("$file") ;; esac
done

node - "${files[@]}" <<'EOF'
const { readFileSync } = require('node:fs')
const Ajv2020 = require('ajv/dist/2020')

const ajv = new Ajv2020({ allErrors: true, strict: true })
const validate = ajv.compile(JSON.parse(readFileSync('schema/market.json', 'utf8')))

// One line per schema error, in plain words where ajv's own are unclear.
const PLAIN = {
  '#/$defs/slug/pattern': 'must be a lowercase slug: letters, digits and single hyphens',
  '#/$defs/line/pattern': 'must be one line of text, not only spaces',
  '#/properties/howDealsGo/pattern': 'must not be empty',
  '#/properties/ratings/items/pattern': 'must be a camelCase name',
  '#/properties/ratings/contains': 'must include "overall"',
  '#/dependentSchemas/roleNames/properties/sides/const': 'must be "two" in a file with roleNames',
}
function say(e) {
  const at = e.instancePath || 'the file'
  if (e.propertyName !== undefined) {
    return e.schemaPath.includes('/not')
      ? `${at}: "${e.propertyName}" is already a base field; a market adds fields, it never redefines them`
      : `${at}: "${e.propertyName}" must be a camelCase field name`
  }
  if (PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  if (e.keyword === 'additionalProperties') return `${at}: unknown key "${e.params.additionalProperty}"`
  if (e.keyword === 'enum') return `${at} must be one of ${e.params.allowedValues.map((v) => JSON.stringify(v)).join(', ')}`
  return `${at} ${e.message}`
}
// Errors that only repeat another: an "if" repeats its "then", a propertyNames its name's error,
// and an item that is not "overall" says nothing the "contains" error doesn't.
const repeats = (e) => e.keyword === 'if' || e.keyword === 'propertyNames' || e.schemaPath.startsWith('#/properties/ratings/contains/')

const files = process.argv.slice(2)
const problems = new Map()
const report = (where, error) => problems.set(where, [...(problems.get(where) ?? []), error])

// directory.md's market lines, read as indexes read them: - [`name`](folder/name.json): ...
const lines = new Map()
readFileSync('directory.md', 'utf8').split('\n').forEach((text, i) => {
  const line = /^- \[`([^`]+)`\]\(([^)\s]+\.json)\)/.exec(text)
  if (line) lines.set(line[2], { name: line[1], at: i + 1 })
})

const seen = new Map()
for (const file of files) {
  let market
  try {
    market = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    report(file, `not JSON: ${e.message}`)
  }
  if (market !== undefined && !validate(market)) for (const e of validate.errors) if (!repeats(e)) report(file, say(e))

  const named = typeof market?.name === 'string'
  if (named && typeof market.folder === 'string') {
    const path = `${market.folder}/${market.name}.json`
    if (file !== path) report(file, `must live at ${path}`)
    if (seen.has(market.name)) report(file, `name "${market.name}" is already used by ${seen.get(market.name)}`)
    else seen.set(market.name, file)
  }

  const listed = lines.get(file)
  if (!listed) report(file, 'has no line in directory.md')
  else if (named && listed.name !== market.name) report('directory.md', `line ${listed.at} lists \`${listed.name}\`, but ${file} names "${market.name}"`)
}
for (const [path, { name, at }] of lines) {
  if (!files.includes(path)) report('directory.md', `line ${at}: \`${name}\` points at ${path}, which is not a market file here`)
}

for (const [where, errors] of problems) {
  console.error(`${where}:`)
  for (const error of errors) console.error(`  - ${error}`)
}
if (problems.size === 0) console.log(`all ${files.length} market files pass, each with its line in directory.md`)
process.exit(problems.size ? 1 : 0)
EOF
