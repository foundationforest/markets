#!/usr/bin/env bash
# Checks the markets and writes the directory:
#   1. every markets/*.json against build/market.schema.json, each field's type against
#      build/types.json, each role's word once per market, each field's roles among the market's
#      roles, and offer.payment's values: "direct", then the market's schedule names;
#   2. each market's name equal to its file's name, which also keeps every name unique;
#   3. when every market passes, directory.json and directory.md as the market files write them,
#      sorted by name: when either is stale, rewrites it and fails, so the new copy gets committed.
#      Nobody edits either by hand.
# Needs Node 22 and npm; installs the locked validator (ajv) into build/node_modules on first run.
# Exit 0 when everything passes, 1 when anything fails.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! node_modules/.package-lock.json -nt package-lock.json ]; then
  npm ci --silent --no-audit --no-fund
fi

node - <<'EOF'
const { existsSync, readFileSync, readdirSync, writeFileSync } = require('node:fs')
const { isDeepStrictEqual } = require('node:util')
const Ajv2020 = require('ajv/dist/2020')
const addFormats = require('ajv-formats')

const root = (path) => `../${path}`
const problems = new Map()
const report = (where, error) => problems.set(where, [...(problems.get(where) ?? []), error])
const readJson = (where) => {
  try {
    return JSON.parse(readFileSync(root(where), 'utf8'))
  } catch (e) {
    report(where, e.code === 'ENOENT' ? 'missing' : `not JSON: ${e.message}`)
  }
}

const finish = () => {
  for (const [where, errors] of problems) {
    console.error(`${where}:`)
    for (const error of errors) console.error(`  - ${error}`)
  }
  process.exit(problems.size ? 1 : 0)
}

// strictRequired is off: a field's "if" requires "values" in its "then", which ajv's lint wants beside
// the field's properties.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
addFormats(ajv)
const types = readJson('build/types.json')
const schema = readJson('build/market.schema.json')
if (types === undefined || schema === undefined) finish()
ajv.compile(types)
const validateMarket = ajv.compile(schema)

// The types are the names types.json defines. The schema lists them too, for anyone who reads it
// alone; the two lists must agree, so a field's type is checked once, against types.json.
const typeNames = Object.keys(types.$defs)
const schemaTypes = schema.$defs.field.properties.type.enum
if (!isDeepStrictEqual([...schemaTypes].sort(), [...typeNames].sort())) {
  report('build/market.schema.json', `its field types (${schemaTypes.join(', ')}) differ from build/types.json's (${typeNames.join(', ')})`)
}

// One line per schema error, in plain words where ajv's own are unclear.
const PLAIN = {
  '#/$defs/word/pattern': 'must be lowercase letters, digits and single hyphens',
  '#/$defs/line/pattern': 'must be one line of text, not only spaces',
  '#/properties/howDealsGo/pattern': 'must not be empty',
  '#/$defs/window/properties/offset/pattern': 'must be a sign, a whole number and h or d, such as "+3d" or "-24h"',
  '#/properties/review/properties/shared/contains': 'must hold "subject": only it defines a review',
  '#/properties/offer/properties/description/not': 'must not hold "many": description is a shared name, and a post holds one',
  '#/properties/offer/properties/price/not': 'must not hold "many": price is a shared name, and a post holds one',
  '#/properties/offer/properties/payment/required': 'must hold "many": true: payment is a shared name',
}
function say(e) {
  const at = e.instancePath || 'the file'
  if (e.propertyName !== undefined) {
    const name = JSON.stringify(e.propertyName)
    if (at === '/payment') {
      return e.keyword === 'not'
        ? `${at}: "direct" is always allowed and is not a schedule`
        : `${at}: ${name} is not a schedule name: lowercase letters, digits and single hyphens, at most 64 characters`
    }
    if (e.keyword === 'not') return `${at}: ${name} is a shared name: list it in "shared"`
    return `${at}: ${name} is not a field name: a lowercase letter, then letters and digits, at most 64 characters`
  }
  if (e.keyword === 'minItems') return `${at} must hold at least ${e.params.limit}`
  if (PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  if (e.keyword === 'const' && e.schemaPath.startsWith('#/properties/offer/properties/')) {
    return `${at} must be ${JSON.stringify(e.params.allowedValue)}: ${e.instancePath.split('/')[2]} is a shared name`
  }
  if (e.keyword === 'not' && e.schemaPath.endsWith('/else/not')) return `${at}: "values" is only for a choice`
  if (e.keyword === 'not' && e.schemaPath.endsWith('/then/not')) return `${at} must not hold "many": words is a list already`
  if (e.keyword === 'const' && /^\/(offer|review\/fields)\/[^/]+\/(many|required)$/.test(e.instancePath)) return `${at} must be true, or left out`
  if (e.keyword === 'required') return `${at}: "${e.params.missingProperty}" is missing`
  if (e.keyword === 'additionalProperties') return `${at}: unknown key "${e.params.additionalProperty}"`
  if (e.keyword === 'enum') return `${at} must be one of ${e.params.allowedValues.map((v) => JSON.stringify(v)).join(', ')}`
  return `${at} ${e.message}`
}
// Errors that only repeat another: an "if" repeats its "then", a "propertyNames" its name's error,
// a "contains" each item it tried, and a field's type outside the schema's list is said once, by
// the check against types.json.
const repeats = (e) =>
  e.keyword === 'if' ||
  e.keyword === 'propertyNames' ||
  e.schemaPath === '#/properties/review/properties/shared/contains/const' ||
  (e.keyword === 'enum' && /^\/(offer|review\/fields)\/[^/]+\/type$/.test(e.instancePath))

// 1 and 2: each market file.
const files = existsSync(root('markets')) ? readdirSync(root('markets')).filter((f) => f.endsWith('.json')).sort() : []
const markets = []
for (const file of files) {
  const where = `markets/${file}`
  const market = readJson(where)
  if (market === undefined) continue
  markets.push(market)
  if (!validateMarket(market)) for (const e of validateMarket.errors) if (!repeats(e)) report(where, say(e))

  if (typeof market?.name === 'string' && `${market.name}.json` !== file) {
    report(where, `its name is "${market.name}", so it must be markets/${market.name}.json`)
  }
  const words = Array.isArray(market?.roles) ? market.roles.map((r) => r?.role) : []
  for (const word of new Set(words.filter((w, i) => typeof w === 'string' && words.indexOf(w) !== i))) {
    report(where, `the role "${word}" is listed twice`)
  }
  const fields = [['/offer', market?.offer], ['/review/fields', market?.review?.fields]]
  for (const [at, block] of fields) {
    if (typeof block !== 'object' || block === null) continue
    for (const [name, field] of Object.entries(block)) {
      if (typeof field?.type === 'string' && !typeNames.includes(field.type)) {
        report(where, `${at}/${name}/type "${field.type}" is not a type: build/types.json has ${typeNames.join(', ')}`)
      }
      for (const role of Array.isArray(field?.roles) ? field.roles : []) {
        if (typeof role === 'string' && !words.includes(role)) {
          report(where, `${at}/${name}/roles: "${role}" is not a role here: the roles are ${words.join(', ')}`)
        }
      }
    }
  }
  // payment, a shared name: an app offers only its values, so they are direct and the schedules.
  const pay = market?.offer?.payment
  const schedules = market?.payment
  if (pay?.type === 'choice' && typeof schedules === 'object' && schedules !== null && !Array.isArray(schedules)) {
    const values = ['direct', ...Object.keys(schedules)]
    if (!isDeepStrictEqual(pay.values, values)) {
      report(where, `/offer/payment/values must be ${JSON.stringify(values)}: "direct", then the schedules in "payment", in order`)
    }
  }
}

// 3: directory.json and directory.md, written from the market files once they all pass.
if (problems.size === 0) {
  const listed = markets
    .map(({ name, description, roles }) => ({ name, description, roles: roles.map(({ role, posts }) => ({ role, posts })) }))
    .sort((a, b) => (a.name < b.name ? -1 : 1))
  const lines = [
    '# Directory',
    '',
    'Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes',
    'this file and [`directory.json`](directory.json) from the market files; nobody edits either by',
    'hand. What a market is: [`README.md`](README.md).',
    '',
  ]
  if (listed.length === 0) lines.push('No markets yet.')
  for (const { name, description, roles } of listed) {
    const end = /[.!?]$/.test(description) ? '' : '.'
    lines.push(`- [\`${name}\`](markets/${name}.json): ${description}${end} Roles: ${roles.map((r) => `${r.role} (${r.posts})`).join(', ')}.`)
  }
  const written = {
    'directory.json': `${JSON.stringify({ markets: listed }, null, 2)}\n`,
    'directory.md': `${lines.join('\n')}\n`,
  }
  for (const [where, text] of Object.entries(written)) {
    const current = existsSync(root(where)) ? readFileSync(root(where), 'utf8') : null
    if (text !== current) {
      writeFileSync(root(where), text)
      report(where, 'was stale: rewritten from the market files; commit it')
    }
  }
}

if (problems.size === 0) {
  console.log(`${files.length} market files: each passes, and directory.json and directory.md are current`)
}
finish()
EOF
