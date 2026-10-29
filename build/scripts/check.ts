// What build/check.sh runs; its comment says what is checked. The market files are checked as they
// are, so they are read as any and every step guards what it reads.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js'
import formats from 'ajv-formats'
import { SHARED } from '../src/index.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const root = (path: string) => join(ROOT, path)
const problems = new Map<string, string[]>()
const report = (where: string, error: string) => problems.set(where, [...(problems.get(where) ?? []), error])
const readJson = (where: string): any => {
  try {
    return JSON.parse(readFileSync(root(where), 'utf8'))
  } catch (e) {
    report(where, (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : `not JSON: ${(e as Error).message}`)
  }
}

const finish = (): never => {
  for (const [where, errors] of problems) {
    console.error(`${where}:`)
    for (const error of errors) console.error(`  - ${error}`)
  }
  process.exit(problems.size ? 1 : 0)
}

// strictRequired is off: a field's "if" requires "values" in its "then", which ajv's lint wants beside
// the field's properties.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
formats.default(ajv)
const types = readJson('build/types.json')
const schema = readJson('build/market.schema.json')
if (types === undefined || schema === undefined) finish()
ajv.compile(types)
const validateMarket = ajv.compile(schema)

// The types are the names types.json defines, and the names every review holds are the package's
// (src/index.ts). The schema lists both too, for anyone who reads it alone; each list must agree, so
// each is checked once, against its source.
const typeNames = Object.keys(types.$defs)
const schemaTypes: string[] = schema.$defs.field.properties.type.enum
if (!isDeepStrictEqual([...schemaTypes].sort(), [...typeNames].sort())) {
  report('build/market.schema.json', `its field types (${schemaTypes.join(', ')}) differ from build/types.json's (${typeNames.join(', ')})`)
}
const sharedNames = Object.keys(SHARED.review)
const schemaShared: string[] | undefined = schema.properties?.review?.propertyNames?.not?.enum
if (!isDeepStrictEqual(schemaShared, sharedNames)) {
  report('build/market.schema.json', `the names a review field may not take (${schemaShared?.join(', ')}) differ from the ones every review holds in src/index.ts (${sharedNames.join(', ')})`)
}

// One line per schema error, in plain words where ajv's own are unclear.
const PLAIN: { [schemaPath: string]: string } = {
  '#/$defs/word/pattern': 'must be lowercase letters, digits and single hyphens',
  '#/$defs/line/pattern': 'must be one line of text, not only spaces',
  '#/properties/post/properties/description/not': 'must not hold "many": description is a shared name, and a post holds one',
  '#/properties/post/properties/price/not': 'must not hold "many": price is a shared name, and a post holds one',
}
function say(e: ErrorObject): string {
  const at = e.instancePath || 'the file'
  if (e.propertyName !== undefined) {
    const name = JSON.stringify(e.propertyName)
    if (e.keyword === 'not' && e.propertyName === 'files') return `${at}: ${name} is not a field name: the standard keeps it for the files an entry names`
    if (e.keyword === 'not') return `${at}: ${name} is a field every review holds: build/README.md defines it, and a market adds only others`
    return `${at}: ${name} is not a field name: a lowercase letter, then letters and digits, at most 64 characters`
  }
  if (e.keyword === 'minItems') return `${at} must hold at least ${e.params.limit}`
  if (PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  if (e.keyword === 'const' && e.schemaPath.startsWith('#/properties/post/properties/')) {
    return `${at} must be ${JSON.stringify(e.params.allowedValue)}: ${e.instancePath.split('/')[2]} is a shared name`
  }
  if (e.keyword === 'not' && e.schemaPath.endsWith('/else/not')) return `${at}: "values" is only for a choice`
  if (e.keyword === 'not' && e.schemaPath.endsWith('/then/not')) return `${at} must not hold "many": words is a list already`
  if (e.keyword === 'const' && /^\/(post|review)\/[^/]+\/(many|required)$/.test(e.instancePath)) return `${at} must be true, or left out`
  if (e.keyword === 'required') return `${at}: "${e.params.missingProperty}" is missing`
  if (e.keyword === 'additionalProperties') return `${at}: unknown key "${e.params.additionalProperty}"`
  if (e.keyword === 'enum') return `${at} must be one of ${e.params.allowedValues.map((v: unknown) => JSON.stringify(v)).join(', ')}`
  return `${at} ${e.message}`
}
// Errors that only repeat another: an "if" repeats its "then", a "propertyNames" its name's error,
// and a field's type outside the schema's list is said once, by the check against types.json.
const repeats = (e: ErrorObject) =>
  e.keyword === 'if' || e.keyword === 'propertyNames' || (e.keyword === 'enum' && /^\/(post|review)\/[^/]+\/type$/.test(e.instancePath))

// 1 and 2: each market file.
const files = existsSync(root('markets')) ? readdirSync(root('markets')).filter((f) => f.endsWith('.json')).sort() : []
const markets: any[] = []
for (const file of files) {
  const where = `markets/${file}`
  const market = readJson(where)
  if (market === undefined) continue
  markets.push(market)
  const errors = validateMarket(market) ? [] : validateMarket.errors!
  for (const e of errors) if (!repeats(e)) report(where, say(e))

  if (typeof market?.name === 'string' && `${market.name}.json` !== file) {
    report(where, `its name is "${market.name}", so it must be markets/${market.name}.json`)
  }
  const words: unknown[] = Array.isArray(market?.roles) ? market.roles.map((r: any) => r?.role) : []
  for (const word of new Set(words.filter((w, i) => typeof w === 'string' && words.indexOf(w) !== i))) {
    report(where, `the role "${word}" is listed twice`)
  }
  for (const [at, block] of [['/post', market?.post], ['/review', market?.review]]) {
    if (typeof block !== 'object' || block === null) continue
    for (const [name, field] of Object.entries<any>(block)) {
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
  // preview: each name one of the market's post fields.
  const postNames = typeof market?.post === 'object' && market.post !== null ? Object.keys(market.post) : []
  for (const name of Array.isArray(market?.preview) ? market.preview : []) {
    if (typeof name === 'string' && !postNames.includes(name)) {
      report(where, `/preview: "${name}" is not a field in "post": the fields are ${postNames.join(', ')}`)
    }
  }
}

// 3: directory.json and directory.md, written from the market files once they all pass.
if (problems.size === 0) {
  const listed = markets
    .map(({ name, description, roles }) => ({ name, description, roles: roles.map(({ role, posts }: any) => ({ role, posts })) }))
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
    lines.push(`- [\`${name}\`](markets/${name}.json): ${description}${end} Roles: ${roles.map((r: any) => `${r.role} (${r.posts})`).join(', ')}.`)
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
