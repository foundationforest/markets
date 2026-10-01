#!/usr/bin/env bash
# Checks every market file here (<folder>/<name>.json; schema/ is not a folder of markets):
#   1. against schema/market.json;
#   2. each name a field block lists as required is one of that block's fields (a JSON Schema
#      cannot state this);
#   3. the file sits at <folder>/<name>.json, with its own folder and name;
#   4. no two files share a name.
# Needs Node 22 and npm; installs the locked validator (ajv) into node_modules/ on first run.
# Exit 0 when every file passes, 1 when any fails.
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
  '#/dependentSchemas/labels/properties/sides/const': 'must be "two" in a file with labels',
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
const seen = new Map()
let failed = 0

for (const file of files) {
  const errors = []
  let market
  try {
    market = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`not JSON: ${e.message}`)
  }

  if (errors.length === 0) {
    if (!validate(market)) for (const e of validate.errors) if (!repeats(e)) errors.push(say(e))

    for (const key of ['offerFields', 'reviewFields']) {
      const block = market?.[key]
      if (!Array.isArray(block?.required)) continue
      const props = block.properties !== null && typeof block.properties === 'object' ? block.properties : {}
      for (const name of block.required) {
        if (!Object.hasOwn(props, name)) errors.push(`/${key}/required: ${JSON.stringify(name)} is not one of this block's fields`)
      }
    }

    if (typeof market?.name === 'string' && typeof market?.folder === 'string') {
      const path = `${market.folder}/${market.name}.json`
      if (file !== path) errors.push(`must live at ${path}`)
      if (seen.has(market.name)) errors.push(`name "${market.name}" is already used by ${seen.get(market.name)}`)
      else seen.set(market.name, file)
    }
  }

  if (errors.length) {
    failed = 1
    console.error(`${file}:`)
    for (const error of errors) console.error(`  - ${error}`)
  }
}

if (!failed) console.log(`all ${files.length} market files pass`)
process.exit(failed)
EOF
