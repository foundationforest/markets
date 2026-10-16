#!/usr/bin/env bash
# Checks the markets directory:
#   1. every markets/*.json against build/market.schema.json, each field's type against
#      build/types.json, and each role's word once per market;
#   2. each market's name equal to its file's name, which also keeps every name unique;
#   3. directory.json listing exactly the market files, each with the name, description and roles
#      its file has;
#   4. directory.md as directory.json writes it: when it is stale, rewrites it and fails, so the
#      new copy gets committed.
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
const validateDirectory = ajv.compile({
  type: 'object',
  required: ['markets'],
  additionalProperties: false,
  properties: {
    markets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'roles'],
        additionalProperties: false,
        properties: {
          name: { $ref: `${schema.$id}#/properties/name` },
          description: { $ref: `${schema.$id}#/properties/description` },
          roles: { $ref: `${schema.$id}#/properties/roles` },
        },
      },
    },
  },
})

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
const markets = new Map()
for (const file of files) {
  const where = `markets/${file}`
  const market = readJson(where)
  if (market === undefined) continue
  markets.set(file.slice(0, -'.json'.length), market)
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
    }
  }
}

// 3: directory.json lists exactly the files.
const directory = readJson('directory.json')
const listed = directory !== undefined && validateDirectory(directory) ? directory.markets : null
if (directory !== undefined && listed === null) for (const e of validateDirectory.errors) if (!repeats(e)) report('directory.json', say(e))
if (listed) {
  const seen = new Set()
  for (const entry of listed) {
    if (seen.has(entry.name)) {
      report('directory.json', `lists "${entry.name}" twice`)
      continue
    }
    seen.add(entry.name)
    const market = markets.get(entry.name)
    if (!files.includes(`${entry.name}.json`)) report('directory.json', `lists "${entry.name}", which has no file markets/${entry.name}.json`)
    else if (market !== undefined) {
      for (const key of ['description', 'roles']) {
        if (!isDeepStrictEqual(entry[key], market[key])) report('directory.json', `"${entry.name}": ${key} not the same as in markets/${entry.name}.json`)
      }
    }
  }
  for (const file of files) {
    if (!seen.has(file.slice(0, -'.json'.length))) report(`markets/${file}`, 'is not in directory.json')
  }

  // 4: directory.md, written from directory.json.
  const lines = [
    '# Directory',
    '',
    'Every market in [`directory.json`](directory.json), one line each. [`build/check.sh`](build/check.sh)',
    'writes this file from it. What a market is: [`README.md`](README.md).',
    '',
  ]
  if (listed.length === 0) lines.push('No markets yet.')
  for (const { name, description, roles } of listed) {
    const end = /[.!?]$/.test(description) ? '' : '.'
    lines.push(`- [\`${name}\`](markets/${name}.json): ${description}${end} Roles: ${roles.map((r) => `${r.role} (${r.posts})`).join(', ')}.`)
  }
  const md = `${lines.join('\n')}\n`
  const current = existsSync(root('directory.md')) ? readFileSync(root('directory.md'), 'utf8') : null
  if (md !== current) {
    writeFileSync(root('directory.md'), md)
    report('directory.md', 'was stale: rewritten from directory.json; commit it')
  }
}

if (problems.size === 0) {
  console.log(`${files.length} market files: each passes, directory.json lists exactly them, and directory.md is current`)
}
finish()
EOF
