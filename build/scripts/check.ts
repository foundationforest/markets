// What build/check.sh runs; its comment says what is checked. The market files are checked as they
// are, so they are read as any and every step guards what it reads.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js'
import formats from 'ajv-formats'
import { SHARED, UNITS } from '../src/markets.ts'

// The checkout to check: this one, or the one its first argument names, as the tests do. The second
// names a copy of main's markets/ and build/types.json to compare the markets live there with, as
// check.sh makes one; without it, nothing is compared.
const ROOT = process.argv[2] ?? fileURLToPath(new URL('../../', import.meta.url))
const MAIN = process.argv[3]
const root = (path: string) => join(ROOT, path)
const problems = new Map<string, string[]>()
const report = (where: string, error: string) => problems.set(where, [...(problems.get(where) ?? []), error])
/** Lines said once, after every problem. */
const notes = new Set<string>()
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
  for (const note of notes) console.error(note)
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

// The types are the names types.json defines, and the units and the names every listing and every
// review holds are the package's (src/markets.ts). The schema lists them too, for anyone who reads it
// alone; each list must agree, so each is checked once, against its source.
const typeNames = Object.keys(types.$defs)
const schemaTypes: string[] = schema.$defs.field.properties.type.enum
if (!isDeepStrictEqual([...schemaTypes].sort(), [...typeNames].sort())) {
  report('build/market.schema.json', `its field types (${schemaTypes.join(', ')}) differ from build/types.json's (${typeNames.join(', ')})`)
}
const schemaUnits: string[] | undefined = schema.$defs.field.properties.unit?.enum
if (!isDeepStrictEqual(schemaUnits, [...UNITS])) {
  report('build/market.schema.json', `its units (${schemaUnits?.join(', ')}) differ from the ones in src/markets.ts (${UNITS.join(', ')})`)
}
for (const kind of ['listing', 'review'] as const) {
  const sharedNames = Object.keys(SHARED[kind])
  const schemaShared: string[] | undefined = schema.properties?.[kind]?.propertyNames?.not?.enum
  if (!isDeepStrictEqual(schemaShared, sharedNames)) {
    report('build/market.schema.json', `the names a ${kind} field may not take (${schemaShared?.join(', ')}) differ from the ones every ${kind} holds in src/markets.ts (${sharedNames.join(', ')})`)
  }
}

// One line per schema error, in plain words where ajv's own are unclear.
const PLAIN: { [schemaPath: string]: string } = {
  '#/$defs/word/pattern': 'must be lowercase letters, digits and single hyphens',
  '#/$defs/line/pattern': 'must be one line of text, not only spaces',
  '#/properties/listing/properties/description/not': 'must not hold "many": description is a shared name, and a listing holds one',
  '#/properties/listing/properties/price/not': 'must not hold "many": price is a shared name, and a listing holds one',
}
function say(e: ErrorObject): string {
  const at = e.instancePath || 'the file'
  if (e.propertyName !== undefined) {
    const name = JSON.stringify(e.propertyName)
    if (e.keyword === 'not' && e.propertyName === 'files') return `${at}: ${name} is not a field name: the standard keeps it for the files an entry names`
    if (e.keyword === 'not' && at === '/listing') return `${at}: ${name} is a field every listing may hold: build/README.md defines it, and no market lists it`
    if (e.keyword === 'not') return `${at}: ${name} is a field every review holds: build/README.md defines it, and a market adds only others`
    return `${at}: ${name} is not a field name: a lowercase letter, then letters and digits, at most 64 characters`
  }
  if (e.keyword === 'minItems') return `${at} must hold at least ${e.params.limit}`
  if (e.keyword === 'minProperties') return `${at} must name at least one field`
  if (PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  if (e.keyword === 'const' && e.schemaPath.startsWith('#/properties/listing/properties/')) {
    return `${at} must be ${JSON.stringify(e.params.allowedValue)}: ${e.instancePath.split('/')[2]} is a shared name`
  }
  // A key kept for one type, such as values for a choice: the field's rule in the schema names both.
  // ajv gives the path from the field, which it checks on its own.
  const only = /\/allOf\/(\d+)\/else\/not$/.exec(e.schemaPath)
  if (only) {
    const rule = schema.$defs.field.allOf[Number(only[1])]
    return `${at}: "${rule.else.not.required[0]}" is only for a ${rule.if.properties.type.const} field`
  }
  if (e.keyword === 'not' && e.schemaPath.endsWith('/then/not')) return `${at} must not hold "many": words is a list already`
  if (e.keyword === 'const' && /^\/(listing|review)\/[^/]+\/many$/.test(e.instancePath)) {
    return `${at} must be ${e.params.allowedValue}, or left out`
  }
  if (e.keyword === 'required') return `${at}: "${e.params.missingProperty}" is missing`
  if (e.keyword === 'additionalProperties') return `${at}: unknown key "${e.params.additionalProperty}"`
  if (e.keyword === 'enum') return `${at} must be one of ${e.params.allowedValues.map((v: unknown) => JSON.stringify(v)).join(', ')}`
  return `${at} ${e.message}`
}
// Errors that only repeat another: an "if" repeats its "then", a "propertyNames" its name's error,
// and a field's type outside the schema's list is said once, by the check against types.json.
const repeats = (e: ErrorObject) =>
  e.keyword === 'if' || e.keyword === 'propertyNames' || (e.keyword === 'enum' && /^\/(listing|review)\/[^/]+\/type$/.test(e.instancePath))

const isObject = (v: unknown): v is { [key: string]: any } => typeof v === 'object' && v !== null && !Array.isArray(v)
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
/** A list as words do it: "a", "a or b", "a, b or c". */
const or = (items: unknown[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items.join(''))

// 1 and 2: each market file.
const files = existsSync(root('markets')) ? readdirSync(root('markets')).filter((f) => f.endsWith('.json')).sort() : []
const markets: any[] = []
/** Each market file read, by its name: the file's, without .json. */
const byName = new Map<string, any>()
for (const file of files) {
  const where = `markets/${file}`
  const market = readJson(where)
  if (market === undefined) continue
  markets.push(market)
  byName.set(file.slice(0, -'.json'.length), market)
  const errors = validateMarket(market) ? [] : validateMarket.errors!
  for (const e of errors) if (!repeats(e)) report(where, say(e))

  if (typeof market?.name === 'string' && `${market.name}.json` !== file) {
    report(where, `its name is "${market.name}", so it must be markets/${market.name}.json`)
  }
  const words: unknown[] = Array.isArray(market?.roles) ? market.roles.map((r: any) => r?.role) : []
  for (const word of new Set(words.filter((w, i) => typeof w === 'string' && words.indexOf(w) !== i))) {
    report(where, `the role "${word}" is listed twice`)
  }
  for (const [at, block] of [['/listing', market?.listing], ['/review', market?.review]]) {
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
      // labels: each one for a value the field lists. On a field of another type, the schema says so.
      if (field?.type === 'choice' && Array.isArray(field.values) && isObject(field.labels)) {
        for (const value of Object.keys(field.labels)) {
          if (!field.values.includes(value)) report(where, `${at}/${name}/labels: ${JSON.stringify(value)} is not one of ${name}'s values`)
        }
      }
      // when: each name a choice field of the same entry, each value one of its values, and the field
      // kept to the roles the named one is for, or it could never apply for the others.
      for (const [dep, values] of Object.entries<any>(isObject(field?.when) ? field.when : {})) {
        const of = Object.hasOwn(block, dep) ? block[dep] : undefined
        if (of?.type !== 'choice' || !Array.isArray(of.values)) {
          report(where, `${at}/${name}/when: "${dep}" is not a choice field in "${at.slice(1)}"`)
          continue
        }
        for (const value of Array.isArray(values) ? values : []) {
          if (!of.values.includes(value)) report(where, `${at}/${name}/when/${dep}: ${JSON.stringify(value)} is not one of ${dep}'s values`)
        }
        if (Array.isArray(of.roles) && !(Array.isArray(field.roles) && field.roles.every((role: unknown) => of.roles.includes(role)))) {
          report(where, `${at}/${name}: its when names "${dep}", which is only for ${of.roles.join(', ')}, so its roles must be among those`)
        }
      }
    }
    // when, again: no field depends on itself, directly or through others, so a form can ask each one
    // after the fields it depends on.
    const done = new Set<string>()
    const visit = (name: string, path: string[]): void => {
      if (path.includes(name)) {
        report(where, `${at}: when goes in a loop (${[...path.slice(path.indexOf(name)), name].join(' depends on ')}), so a form cannot ask any of them first`)
        return
      }
      if (done.has(name)) return
      const when = isObject(block[name]?.when) ? block[name].when : {}
      for (const dep of Object.keys(when)) if (Object.hasOwn(block, dep)) visit(dep, [...path, name])
      done.add(name)
    }
    for (const name of Object.keys(block)) visit(name, [])
  }
  // preview: each name one of the market's listing fields.
  const listingNames = typeof market?.listing === 'object' && market.listing !== null ? Object.keys(market.listing) : []
  for (const name of Array.isArray(market?.preview) ? market.preview : []) {
    if (typeof name === 'string' && !listingNames.includes(name)) {
      report(where, `/preview: "${name}" is not a field in "listing": the fields are ${listingNames.join(', ')}`)
    }
  }
}

// 3: each market live on main only grows, and a market new here starts as beta. Main's files passed
// this check when they were merged, in the format of their day, so they are read as any too, and
// every step guards what it reads.
let live = 0
if (MAIN !== undefined) {
  const readMain = (path: string): any => {
    try {
      return JSON.parse(readFileSync(join(MAIN, path), 'utf8'))
    } catch {
      return undefined
    }
  }
  const mainFiles = existsSync(join(MAIN, 'markets')) ? readdirSync(join(MAIN, 'markets')).filter((f) => f.endsWith('.json')).sort() : []
  const onMain = new Map(mainFiles.map((file) => [file.slice(0, -'.json'.length), readMain(`markets/${file}`)]))

  for (const [name, market] of byName) {
    if (market?.status === 'live' && !onMain.has(name)) {
      report(`markets/${name}.json`, 'is new and live: a market starts as beta; live is a promise made after it has been tried')
    }
  }

  const words = (market: any): unknown[] => list(market?.roles).map((r: any) => r?.role)
  /** The types each live market uses, with the markets that use them, for build/types.json below. */
  const users = new Map<string, Set<string>>()
  const uses = (type: unknown, name: string) => {
    if (typeof type === 'string') users.set(type, (users.get(type) ?? new Set()).add(name))
  }
  for (const [name, was] of onMain) {
    if (was?.status !== 'live') continue
    live++
    const where = `markets/${name}.json, live on main`
    const broke = (error: string) => {
      report(where, error)
      notes.add('A market live on main only grows: one that must break becomes a new market, with a new name.')
    }
    for (const fields of Object.values(SHARED)) for (const field of Object.values(fields)) uses(field.type, name)
    const now = byName.get(name)
    if (now === undefined) {
      broke('is gone: its profiles, and all they posted, would be left with no market')
      continue
    }
    if (now?.status === 'beta') broke('/status is beta: a live market never goes back')

    // Roles: each one still here, its listings what they were, or each profile in it changes what it is.
    const nowRoles = list(now?.roles)
    for (const role of list(was.roles) as any[]) {
      const is: any = nowRoles.find((r: any) => r?.role === role?.role)
      if (is === undefined) broke(`/roles: "${role?.role}" is gone: every ${role?.role} profile would be left with no role`)
      else if (is?.listings !== role?.listings) {
        broke(`/roles: ${role.role}'s listings are ${is?.listings}, and ${role.listings} on main: every ${role.role} profile would change what it is`)
      }
    }

    // Fields: each one still here, taking at least every value it took, wherever it applied.
    for (const kind of ['listing', 'review'] as const) {
      const before = isObject(was[kind]) ? was[kind] : {}
      const after = isObject(now?.[kind]) ? now[kind] : {}
      for (const [key, field] of Object.entries<any>(before)) {
        if (!isObject(field)) continue
        uses(field.type, name)
        const at = `/${kind}/${key}`
        const posted = `${kind}s already posted`
        const is = Object.hasOwn(after, key) ? after[key] : undefined
        if (!isObject(is)) {
          broke(`${at} is gone: ${posted} that hold ${key} would stop fitting`)
          continue
        }
        if (is.type !== field.type) {
          broke(`${at}/type is ${is.type}, and ${field.type} on main: ${posted} that hold ${key} would stop fitting`)
          continue
        }
        const holds = (many: unknown) => (many ? 'a list' : 'one value')
        if (Boolean(is.many) !== Boolean(field.many)) broke(`${at} holds ${holds(is.many)}, and ${holds(field.many)} on main: ${posted} that hold ${key} would stop fitting`)
        for (const value of list(field.values)) {
          if (!list(is.values).includes(value)) broke(`${at}/values: ${JSON.stringify(value)} is gone: ${posted} whose ${key} ${field.many ? 'holds' : 'is'} ${value} would stop fitting`)
        }
        for (const per of list(field.per)) {
          if (!list(is.per).includes(per)) broke(`${at}/per: ${JSON.stringify(per)} is gone: ${posted} whose ${key} is per ${per} would stop fitting`)
        }
        if (field.unit !== undefined && typeof is.unit === 'string' && is.unit !== field.unit) {
          broke(`${at}/unit is ${is.unit}, and ${field.unit} on main: ${posted} that hold ${key} would keep their number and change its meaning`)
        }
        // roles: the roles it applied to, which a role gone from the market, said above, leaves.
        const wasFor = list(field.roles ?? words(was))
        const nowFor = list(is.roles ?? words(now))
        for (const role of wasFor) {
          if (!nowFor.includes(role) && words(now).includes(role)) {
            broke(`${at}/roles: ${role} is left out: ${kind === 'listing' ? `listings by ${role}` : `reviews of ${role}`} already posted that hold ${key} would stop fitting`)
          }
        }
        // when: no field named that was not, and each value still listed.
        const whenWas = isObject(field.when) ? field.when : {}
        for (const [dep, values] of Object.entries<any>(isObject(is.when) ? is.when : {})) {
          if (!Object.hasOwn(whenWas, dep)) {
            broke(`${at}/when names ${dep}, which it did not on main: ${posted} that hold ${key}, and whose ${dep} is not ${or(list(values))}, would stop fitting`)
            continue
          }
          for (const value of list(whenWas[dep])) {
            if (!list(values).includes(value)) broke(`${at}/when/${dep}: ${JSON.stringify(value)} is gone: ${posted} that hold ${key}, and whose ${dep} is ${value}, would stop fitting`)
          }
        }
      }
    }
  }

  // build/types.json: each type a live market uses, and each it refers to, as it is on main but for
  // its descriptions. Whether a change only widens a type is more than this check can tell, so a type
  // that must change becomes a new one.
  const typesMain = readMain('build/types.json')
  const defsMain = isObject(typesMain?.$defs) ? typesMain.$defs : {}
  const refs = (schema: unknown): string[] =>
    Array.isArray(schema) ? schema.flatMap(refs) : isObject(schema) ? Object.entries(schema).flatMap(([k, v]) => (k === '$ref' && typeof v === 'string' ? [v] : refs(v))) : []
  for (const [type, by] of users) {
    for (const ref of refs(defsMain[type])) {
      const to = /^#\/\$defs\/([^/]+)/.exec(ref)?.[1]
      if (to !== undefined && to !== type) for (const name of by) uses(to, name)
    }
  }
  const bare = (schema: unknown): unknown => {
    if (!isObject(schema)) return schema
    const { description: _description, title: _title, ...rest } = schema
    for (const key of ['$defs', 'properties']) {
      if (isObject(rest[key])) rest[key] = Object.fromEntries(Object.entries(rest[key]).map(([name, sub]) => [name, bare(sub)]))
    }
    if (rest.items !== undefined) rest.items = bare(rest.items)
    if (Array.isArray(rest.oneOf)) rest.oneOf = rest.oneOf.map(bare)
    return rest
  }
  for (const [type, by] of [...users].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (Object.hasOwn(defsMain, type) && !isDeepStrictEqual(bare(defsMain[type]), bare(types.$defs[type]))) {
      const names = [...by].sort()
      report('build/types.json, used by markets live on main', `/$defs/${type} differs from main's beyond its descriptions, and ${or(names)} ${names.length > 1 ? 'use' : 'uses'} it: entries already posted could stop fitting; add a new type instead`)
    }
  }
}

// 4: directory.json and directory.md, written from the market files once they all pass.
if (problems.size === 0) {
  const listed = markets
    .map(({ name, description, status, roles }) => ({ name, description, status, roles: roles.map(({ role, listings }: any) => ({ role, listings })) }))
    .sort((a, b) => (a.name < b.name ? -1 : 1))
  const lines = [
    '# Directory',
    '',
    'Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes',
    'this file and [`directory.json`](directory.json) from the market files; nobody edits either by',
    'hand. What a market is: [`README.md`](README.md).',
    '',
    'A live market needs no payment between people yet, is polished, and from now on only grows. A',
    'beta market works, at your own risk, and may still change in any way.',
    '',
  ]
  if (listed.length === 0) lines.push('No markets yet.')
  for (const { name, description, status, roles } of listed) {
    const end = /[.!?]$/.test(description) ? '' : '.'
    lines.push(`- [\`${name}\`](markets/${name}.json) (${status}): ${description}${end} Roles: ${roles.map((r: any) => `${r.role} (${r.listings})`).join(', ')}.`)
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
  const compared = MAIN === undefined ? '' : live ? `; ${live} live on main, and each only grows` : '; none is live on main'
  console.log(`${files.length} market files: each passes, and directory.json and directory.md are current${compared}`)
}
finish()
