// What build/check.sh runs; its comment says what is checked. The market files are checked as they
// are, so they are read as any and every step guards what it reads.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js'
import { PIECES, SHARED, UNITS, WAYS } from '../src/markets.ts'

// The checkout to check: this one, or the one its first argument names, as the tests do. The second
// names a copy of main's markets/ and build/lists.json to compare with, as check.sh makes one;
// without it, nothing is compared.
const ROOT = process.argv[2] ?? fileURLToPath(new URL('../../', import.meta.url))
const MAIN = process.argv[3]
const root = (path: string) => join(ROOT, path)
const problems = new Map<string, string[]>()
/** Says an error about a file, once. */
const report = (where: string, error: string) => {
  const said = problems.get(where) ?? []
  if (!said.includes(error)) problems.set(where, [...said, error])
}
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

const isObject = (v: unknown): v is { [key: string]: any } => typeof v === 'object' && v !== null && !Array.isArray(v)
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
/** A list as words do it: "a", "a or b", "a, b or c"; and with and. */
const or = (items: unknown[], word = 'or') => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${word} ${items.at(-1)}` : items.join(''))
const WORD = /^[a-z0-9]+(-[a-z0-9]+)*$/
const LINE = /^[^\r\n]*\S[^\r\n]*$/

// strictRequired is off: a field's "if" requires "values" in its "then", which ajv's lint wants beside
// the field's properties.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
const lists = readJson('build/lists.json')
const schema = readJson('build/market.schema.json')
const icons = readJson('build/icons.json')
if (lists === undefined || schema === undefined || icons === undefined) finish()
const validateMarket = ajv.compile(schema)
// The Phosphor icons a market may name, pinned in build/icons.json, so the check reads nothing over
// the network.
const iconNames = new Set<unknown>(Array.isArray(icons.icons) ? icons.icons : [])
if (iconNames.size === 0) report('build/icons.json', 'holds no list of icons')

// build/lists.json: each list by a name, each value with its words, and each country a two-letter code.
if (!isObject(lists)) report('build/lists.json', 'must be an object of lists, by name')
for (const [name, values] of Object.entries(isObject(lists) ? lists : {})) {
  if (!WORD.test(name)) report('build/lists.json', `"${name}" is not a list name: lowercase letters, digits and single hyphens`)
  if (!isObject(values) || Object.keys(values).length === 0) report('build/lists.json', `/${name} must be an object of one or more values, each with its words`)
  for (const [value, words] of Object.entries(isObject(values) ? values : {})) {
    if (!LINE.test(value) || typeof words !== 'string' || !LINE.test(words)) report('build/lists.json', `/${name}/${value}: a value and its words are each one line of text`)
  }
}
for (const code of Object.keys(isObject(lists?.countries) ? lists.countries : {})) {
  if (!/^[A-Z]{2}$/.test(code)) report('build/lists.json', `/countries/${code} is not a two-letter code, as ISO 3166-1 writes one`)
}
/** A choice's values: its own list, or the shared list it names, in `from`'s lists. */
const valuesOf = (field: any, from: any = lists): unknown[] =>
  typeof field?.values === 'string' ? (isObject(from) && isObject(from[field.values]) ? Object.keys(from[field.values]) : []) : list(field?.values)

// The pieces, the units, the ways and the names every listing and every review holds are the
// package's (src/markets.ts). The schema lists them too, for anyone who reads it alone; each must agree.
const agree = (what: string, schemaList: unknown, packageList: readonly string[]) => {
  if (!isDeepStrictEqual(schemaList, [...packageList])) {
    report('build/market.schema.json', `its ${what} (${list(schemaList).join(', ')}) differ from the ones in src/markets.ts (${packageList.join(', ')})`)
  }
}
agree('pieces', schema.$defs?.field?.properties?.piece?.enum, PIECES)
agree('units', schema.$defs?.field?.properties?.unit?.enum, UNITS)
agree('ways', schema.$defs?.start?.properties?.way?.enum, WAYS)
agree('names a listing field may not take', schema.properties?.listing?.propertyNames?.not?.enum, Object.keys(SHARED.listing))
agree('names a review field may not take', schema.properties?.review?.propertyNames?.not?.enum, Object.keys(SHARED.review))

// One line per schema error, in plain words where ajv's own are unclear.
const PLAIN: { [schemaPath: string]: string } = {
  '#/$defs/word/pattern': 'must be lowercase letters, digits and single hyphens',
  '#/$defs/line/pattern': 'must be one line of text, not only spaces',
  '#/properties/number/type': 'must be a whole number from 1',
  '#/properties/number/minimum': 'must be a whole number from 1',
  '#/properties/summary/maxLength': 'must be at most 80 characters: an app shows it where someone picks a market',
  '#/properties/listing/properties/description/not': 'must not hold "several": description is a shared name, and a listing holds one',
  '#/properties/listing/properties/description/properties/piece/const': 'must be "text": description is a shared name, a listing\'s main text',
  '#/properties/listing/properties/price/properties/piece/const': 'must be "price": price is a shared name, the money a program sorts by',
}
/** The same, for a field, whose paths ajv gives from the field's own schema. */
const PLAIN_FIELD: { [schemaPath: string]: string } = {
  '#/allOf/3/then/not': 'must not hold "several": a price is always several',
  '#/properties/values/oneOf': 'must be a list of values, or the name of a list in build/lists.json',
  '#/properties/per/items/not': 'must not be visit, session or lesson: its length is unknown, so a price per one compares with no price per hour; a price for time is per hour, for a length',
}
/** A field's own path, where ajv's schema paths start from the field's schema. */
const FIELD = /^\/(listing|review)\/[^/]+(\/|$)/
const FIELD_ONLY = /^\/(listing|review)\/[^/]+$/
/** The key each of the field's allOf rules keeps for one piece, and that piece. */
const KEPT = [['values', 'choice'], ['unit', 'number'], ['per', 'price']] as const
function say(e: ErrorObject): string {
  const at = e.instancePath || 'the file'
  if (e.propertyName !== undefined) {
    const name = JSON.stringify(e.propertyName)
    if (e.keyword === 'not' && e.propertyName === 'files') return `${at}: ${name} is not a field name: the standard keeps it for the files an entry names`
    if (e.keyword === 'not' && at === '/listing') return `${at}: ${name} is a field every listing may hold: build/README.md defines it, and no market lists it`
    if (e.keyword === 'not') return `${at}: ${name} is a field every review holds: build/README.md defines it, and a market adds only others`
    return `${at}: ${name} is not a field name: a lowercase letter, then letters and digits, at most 64 characters`
  }
  const field = FIELD.test(e.instancePath)
  if (!field && PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  if (field && PLAIN_FIELD[e.schemaPath]) return `${at} ${PLAIN_FIELD[e.schemaPath]}`
  if (PLAIN[e.schemaPath]) return `${at} ${PLAIN[e.schemaPath]}`
  const kept = FIELD_ONLY.test(e.instancePath) && /^#\/allOf\/([0-2])\/else\/not$/.exec(e.schemaPath)
  if (kept) {
    const [key, piece] = KEPT[Number(kept[1])]!
    return `${at}: "${key}" is only for a ${piece} field`
  }
  if (e.keyword === 'minItems') return `${at} must hold at least ${e.params.limit}`
  if (e.keyword === 'minProperties') return `${at} must not be empty`
  if (e.keyword === 'const' && e.params.allowedValue === true) return `${at} must be true, or left out`
  if (e.keyword === 'required') return `${at}: "${e.params.missingProperty}" is missing`
  if (e.keyword === 'additionalProperties') return `${at}: unknown key "${e.params.additionalProperty}"`
  if (e.keyword === 'enum') return `${at} must be one of ${e.params.allowedValues.map((v: unknown) => JSON.stringify(v)).join(', ')}`
  return `${at} ${e.message}`
}
// Errors that only repeat another: an "if" repeats its "then", a "propertyNames" its name's error, and
// each way a choice's values fail says again that they fit neither.
const repeats = (e: ErrorObject) => e.keyword === 'if' || e.keyword === 'propertyNames' || (/^\/(listing|review)\/[^/]+\/values(\/|$)/.test(e.instancePath) && e.keyword !== 'oneOf')

/** The keys a start may hold, by piece, since each opens one piece's input. */
const STARTS: { [piece: string]: string[] } = { place: ['radiusKm'], date: ['way', 'hours'], number: ['range'] }

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

  if (typeof market?.name === 'string' && `${market.name}.json` !== file) report(where, `its name is "${market.name}", so it must be markets/${market.name}.json`)
  if (typeof market?.icon === 'string' && !iconNames.has(market.icon)) report(where, `/icon: "${market.icon}" is not a Phosphor icon: build/icons.json lists them`)
  const words: unknown[] = Array.isArray(market?.roles) ? market.roles.map((r: any) => r?.role) : []
  for (const word of new Set(words.filter((w, i) => typeof w === 'string' && words.indexOf(w) !== i))) report(where, `the role "${word}" is listed twice`)
  const isRole = (at: string, role: unknown) => {
    if (typeof role === 'string' && !words.includes(role)) report(where, `${at}: "${role}" is not a role here: the roles are ${words.join(', ')}`)
  }

  for (const [at, block] of [['/listing', market?.listing], ['/review', market?.review]] as const) {
    if (!isObject(block)) continue
    for (const [name, field] of Object.entries<any>(block)) {
      if (!isObject(field)) continue
      const here = `${at}/${name}`
      for (const role of list(field.roles)) isRole(`${here}/roles`, role)
      if (typeof field.values === 'string' && WORD.test(field.values) && !(isObject(lists) && isObject(lists[field.values]))) {
        report(where, `${here}/values: "${field.values}" is not a list in build/lists.json`)
      }
      const values = valuesOf(field)

      // ask: each key for the piece it opens, each role one of the market's, each label for a value.
      const ask = isObject(field.ask) ? field.ask : {}
      for (const [key, piece] of [['long', 'text'], ['labels', 'choice']] as const) {
        if (Object.hasOwn(ask, key) && field.piece !== piece) report(where, `${here}/ask: "${key}" is only for a ${piece} field`)
      }
      if (field.piece === 'choice' && isObject(ask.labels)) {
        for (const value of Object.keys(ask.labels)) if (!values.includes(value)) report(where, `${here}/ask/labels: ${JSON.stringify(value)} is not one of ${name}'s values`)
      }
      for (const role of Object.keys(isObject(ask.as) ? ask.as : {})) isRole(`${here}/ask/as`, role)
      const starts: [string, unknown][] = [[`${here}/ask/start`, ask.start], ...Object.entries<any>(isObject(ask.as) ? ask.as : {}).map(([role, w]): [string, unknown] => [`${here}/ask/as/${role}/start`, w?.start])]
      for (const [path, start] of starts) {
        for (const key of Object.keys(isObject(start) ? start : {})) {
          const piece = Object.keys(STARTS).find((p) => STARTS[p]!.includes(key))
          if (piece && field.piece !== piece) report(where, `${path}: "${key}" is only for a ${piece} field`)
        }
      }

      // when: each name a choice field of the same entry, each value one of its values, and the field
      // kept to the roles the named one is for, or it could never apply for the others.
      for (const [dep, depValues] of Object.entries<any>(isObject(field.when) ? field.when : {})) {
        const of = Object.hasOwn(block, dep) ? block[dep] : undefined
        if (of?.piece !== 'choice') {
          report(where, `${here}/when: "${dep}" is not a choice field in "${at.slice(1)}"`)
          continue
        }
        // A choice with no values is said above.
        if (of.values === undefined) continue
        for (const value of list(depValues)) if (!valuesOf(of).includes(value)) report(where, `${here}/when/${dep}: ${JSON.stringify(value)} is not one of ${dep}'s values`)
        if (Array.isArray(of.roles) && !(Array.isArray(field.roles) && field.roles.every((role: unknown) => of.roles.includes(role)))) {
          report(where, `${here}: its when names "${dep}", which is only for ${of.roles.join(', ')}, so its roles must be among those`)
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
      for (const dep of Object.keys(isObject(block[name]?.when) ? block[name].when : {})) if (Object.hasOwn(block, dep)) visit(dep, [...path, name])
      done.add(name)
    }
    for (const name of Object.keys(block)) visit(name, [])
  }
  // preview: each name one of the market's listing fields.
  const listingNames = isObject(market?.listing) ? Object.keys(market.listing) : []
  for (const name of list(market?.preview)) {
    if (typeof name === 'string' && !listingNames.includes(name)) report(where, `/preview: "${name}" is not a field in "listing": the fields are ${listingNames.join(', ')}`)
  }
}
// icon and number: no two markets the same, so a list of them tells each apart.
for (const key of ['icon', 'number'] as const) {
  const by = new Map<unknown, string[]>()
  for (const [name, market] of byName) if (key === 'icon' ? typeof market?.icon === 'string' : Number.isInteger(market?.number)) by.set(market[key], [...(by.get(market[key]) ?? []), name])
  for (const [value, names] of by) {
    for (const name of names.length > 1 ? names : []) {
      const others = or(names.filter((other) => other !== name), 'and')
      report(`markets/${name}.json`, key === 'icon' ? `/icon: "${value}" is also the icon of ${others}: no two markets share one, so a list of them tells each apart` : `/number: ${value} is also the number of ${others}: no two markets share one, since apps tell markets apart by it`)
    }
  }
}

// 3: against main. Main's files passed this check when they were merged, in the format of their day,
// so they are read as any too, and every step guards what it reads.
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
  const listsMain = readMain('build/lists.json')

  // A shared list only grows: each list and each value in it stays, so every answer given from it still fits.
  for (const [name, values] of Object.entries<any>(isObject(listsMain) ? listsMain : {})) {
    const now = isObject(lists) ? lists[name] : undefined
    if (!isObject(now)) {
      report('build/lists.json', `/${name} is gone, and on main: answers already given from it would stop fitting`)
      notes.add('A shared list only grows.')
      continue
    }
    for (const value of Object.keys(isObject(values) ? values : {})) {
      if (!Object.hasOwn(now, value)) {
        report('build/lists.json', `/${name}/${value} is gone, and on main: answers already given as ${value} would stop fitting`)
        notes.add('A shared list only grows.')
      }
    }
  }

  for (const [name, market] of byName) {
    if (market?.status === 'live' && !onMain.has(name)) report(`markets/${name}.json`, 'is new and live: a market starts as beta; live is a promise made after it has been tried')
  }
  // A market new here takes the next number after the highest on main, so the markets new here
  // together take the numbers right after it, one each.
  const top = Math.max(0, ...[...onMain.values()].map((market) => (Number.isInteger(market?.number) ? market.number : 0)))
  const added = [...byName].filter(([name, market]) => !onMain.has(name) && Number.isInteger(market?.number))
  const next = added.map((_, i) => top + 1 + i)
  for (const [name, market] of added) {
    if (!next.includes(market.number)) report(`markets/${name}.json`, `/number is ${market.number}, but a market new here takes the next number after the highest on main, ${top}: here ${or(next, 'and')}`)
  }

  // Each market live on main only grows, on its rules: whatever was posted in it still fits, and every
  // profile stays what it is. Its suggestions, under ask, its summary, description, icon and preview
  // may change in any way.
  const words = (market: any): unknown[] => list(market?.roles).map((r: any) => r?.role)
  for (const [name, was] of onMain) {
    if (was?.status !== 'live') continue
    live++
    const where = `markets/${name}.json, live on main`
    const broke = (error: string) => {
      report(where, error)
      notes.add('A market live on main only grows: one that must break becomes a new market, with a new name.')
    }
    const now = byName.get(name)
    if (now === undefined) {
      broke('is gone: its profiles, and all they posted, would be left with no market')
      continue
    }
    if (now?.status === 'beta') broke('/status is beta: a live market never goes back')
    if (Number.isInteger(was.number) && now?.number !== was.number) broke(`/number is ${now?.number}, and ${was.number} on main: apps tell markets apart by it, so a live market keeps its own`)

    // Roles: each one still here, its listings what they were, or each profile in it changes what it is.
    const nowRoles = list(now?.roles)
    for (const role of list(was.roles) as any[]) {
      const is: any = nowRoles.find((r: any) => r?.role === role?.role)
      if (is === undefined) broke(`/roles: "${role?.role}" is gone: every ${role?.role} profile would be left with no role`)
      else if (is?.listings !== role?.listings) broke(`/roles: ${role.role}'s listings are ${is?.listings}, and ${role.listings} on main: every ${role.role} profile would change what it is`)
    }

    // Fields: each one still here, of the same piece, taking at least every answer it took, wherever it applied.
    for (const kind of ['listing', 'review'] as const) {
      const before = isObject(was[kind]) ? was[kind] : {}
      const after = isObject(now?.[kind]) ? now[kind] : {}
      for (const [key, field] of Object.entries<any>(before)) {
        if (!isObject(field)) continue
        const at = `/${kind}/${key}`
        const posted = `${kind}s already posted`
        const is = Object.hasOwn(after, key) ? after[key] : undefined
        if (!isObject(is)) {
          broke(`${at} is gone: ${posted} that hold ${key} would stop fitting`)
          continue
        }
        if (is.piece !== field.piece) {
          broke(`${at}/piece is ${is.piece}, and ${field.piece} on main: ${posted} that hold ${key} would stop fitting`)
          continue
        }
        const holds = (several: unknown) => (several ? 'several answers' : 'one answer')
        if (Boolean(is.several) !== Boolean(field.several)) broke(`${at} takes ${holds(is.several)}, and ${holds(field.several)} on main: ${posted} that hold ${key} would stop fitting`)
        const nowValues = valuesOf(is)
        for (const value of valuesOf(field, listsMain)) {
          if (!nowValues.includes(value)) broke(`${at}/values: ${JSON.stringify(value)} is gone: ${posted} whose ${key} ${field.several ? 'holds' : 'is'} ${value} would stop fitting`)
        }
        for (const per of list(field.per)) {
          if (!list(is.per).includes(per)) broke(`${at}/per: ${JSON.stringify(per)} is gone: ${posted} whose ${key} is per ${per} would stop fitting`)
        }
        if (is.unit !== field.unit) broke(`${at}/unit is ${is.unit ?? 'none'}, and ${field.unit ?? 'none'} on main: ${posted} that hold ${key} would keep their number and change its meaning`)
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
}

// 4: directory.json and directory.md, written from the market files once they all pass.
if (problems.size === 0) {
  const listed = markets
    .map(({ name, summary, description, status, icon, number, roles }) => ({ name, summary, description, status, icon, number, roles: roles.map(({ role, listings }: any) => ({ role, listings })) }))
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
  /** A line as a sentence: with a full stop, unless it ends in one, a question mark or an exclamation mark. */
  const sentence = (line: string) => (/[.!?]$/.test(line) ? line : `${line}.`)
  for (const { name, summary, description, status, roles } of listed) {
    const said = [summary, ...(typeof description === 'string' ? [description] : [])].map(sentence).join(' ')
    lines.push(`- [\`${name}\`](markets/${name}.json) (${status}): ${said} Roles: ${roles.map((r: any) => `${r.role} (${r.listings})`).join(', ')}.`)
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
