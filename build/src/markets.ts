// The markets from their files, given as data, and checkEntry, which checks a post, a review, a vouch
// or a report against its market as the manual says (build/README.md). Both entries use it: index.ts
// reads the files from a checkout, browser.ts takes them from a page. It imports nothing and makes no
// code from strings, so it runs where a content security policy forbids eval.
//
// A body fits when each of its fields is one its market names for that kind and role, or a shared
// one, held only where its `when` matches, of its type (build/types.json): a choice among its values,
// money with a `per` its field lists or none, a place with a point and a radius, `many` a list of
// distinct values, a `file` the SHA-256 of one of the body's `files`. `files` is the
// standard's, checked with the entry, and no market's field. No field must be held, except that a
// review, a vouch and a report name their subject: only it says who one is about. Whether `subject`,
// or the profile in a review's `post`, is an address is the standard's check (folders), not this one.

export type Type = 'text' | 'number' | 'words' | 'choice' | 'place' | 'money' | 'moment' | 'file' | 'hours'
export type Field = {
  type: Type
  description: string
  values?: string[]
  /** For a choice field: how people read a value whose words are wrong, such as XL for xl; every other value reads as its words. */
  labels?: { [value: string]: string }
  per?: string[]
  /** For a place field: the radius, in whole kilometres, a new place starts at. */
  radiusKm?: number
  many?: true
  roles?: string[]
  /** The choice fields of the same entry this one depends on, each with the values that make it apply. */
  when?: { [field: string]: string[] }
}
export type Fields = { [name: string]: Field }
export type Role = { role: string; posts: 'offers' | 'requests' | 'posts' }
/** A market file, markets/<name>.json, as build/market.schema.json defines it. */
export type Market = { name: string; description: string; roles: Role[]; post: Fields; preview?: string[]; review?: Fields }
/** directory.json: every market, its description and its roles. */
export type Directory = { markets: Array<Pick<Market, 'name' | 'description' | 'roles'>> }
/** The files the markets are read from: directory.json, build/types.json, and the market file of each market the directory lists. */
export type Files = { directory: Directory; types: unknown; markets: Market[] }

const KINDS = ['post', 'review', 'vouch', 'report'] as const
/** The kinds of entry, each at `<kind>/<id>` in a profile's folder. */
export type Kind = (typeof KINDS)[number]

/**
 * The fields each kind holds in every market, beyond its market's, as the manual defines them: a
 * post's contact (Shared names), and what every review, vouch and report holds (Reviews, vouches and
 * reports). A market adds fields to its reviews only, and never lists contact.
 */
export const SHARED: { [kind in Kind]: Fields } = {
  post: {
    contact: { type: 'text', description: 'How to reach the writer outside Forest, such as a phone, a handle or an email.' },
  },
  review: {
    subject: { type: 'text', description: 'The address of the profile the review is about, in the same market.' },
    score: { type: 'number', description: 'The rating, from "1" to "10" with at most one decimal, such as "8.5".' },
    text: { type: 'text', description: 'What the reviewer says.' },
    post: { type: 'text', description: 'The address of the post the review is about, <profile address>/post/<id>, whoever wrote it.' },
  },
  vouch: {
    subject: { type: 'text', description: 'The address of the profile the vouch is about, in the same market.' },
    text: { type: 'text', description: 'Why the writer vouches for it.' },
  },
  report: {
    subject: { type: 'text', description: 'The address of the profile the report is about, in the same market.' },
    text: { type: 'text', description: 'Why the writer reports it.' },
  },
}

/** What a shared name takes beyond its type. */
const MEANS: { [name: string]: { fits: RegExp; takes: string } } = {
  score: { fits: /^(10(\.0)?|[1-9](\.[0-9])?)$/, takes: 'a number from "1" to "10" with at most one decimal, such as "8.5"' },
  post: { fits: /^[^/]+\/post\/[^/]+$/, takes: "a post's address, <profile address>/post/<id>" },
}

/** What each type takes, in words; choice and money say what their field allows. */
const TAKES: { [type in Exclude<Type, 'choice' | 'money'>]: string } = {
  text: 'text',
  number: 'a number as decimal text, such as "2.5"',
  words: 'a list of short words, each different',
  place: '{ lat, lon, radiusKm, area }: lat and lon as decimal text, radiusKm in whole kilometres, and area a name if wanted',
  moment: 'a time in RFC 3339 with its zone, such as 2026-11-02T18:00:00+01:00, or { from, to }',
  file: 'the SHA-256 of one of the files the body lists in files, in lowercase hex',
  hours: '{ zone, slots: [{ days, from, to }] }: days as monday to sunday, times as HH:MM',
}

const takes = (field: Field) => {
  const one =
    field.type === 'choice'
      ? `one of ${field.values!.join(', ')}`
      : field.type === 'money'
        ? field.per
          ? `{ amount, currency, per }: amount as decimal text, currency a code such as USD, per one of ${field.per.join(', ')} if wanted`
          : '{ amount, currency }: amount as decimal text, currency a code such as USD, and no per'
        : TAKES[field.type]
  return field.many ? `a list, each different, each ${one}` : one
}

const isObject = (v: unknown): v is { [key: string]: unknown } => typeof v === 'object' && v !== null && !Array.isArray(v)

/** A list as words do it: "a", "a or b", "a, b or c". */
const or = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items.join(''))

/** The SHA-256 of each file the body lists in `files`. */
const filesOf = (body: { [key: string]: unknown }): unknown[] =>
  Array.isArray(body.files) ? body.files.map((file: unknown) => (isObject(file) ? file.sha256 : undefined)) : []

export type Markets = {
  /** directory.json, as the checkout holds it. */
  directory: Directory
  /** A market's file, as markets/<name>.json holds it, or undefined when the directory lists no such market. */
  market(name: string): Market | undefined
  /**
   * Why `body` does not fit as a `kind` entry by a `role` profile in `market`: the first field that
   * does not, in plain words, or null when it fits. `aboutRole` is, for a review, the role of the
   * profile it is about: a review field kept for some roles is checked against it, and not checked
   * when it is left out.
   */
  checkEntry(market: string, role: string, kind: string, body: unknown, aboutRole?: string): string | null
}

/**
 * Whether a value is of a field's type: a choice among its values, money with a `per` its field
 * lists or none, a list of distinct ones when `many`.
 */
export type Fits = (field: Field, value: unknown) => boolean

/**
 * The markets in `files`. `fits` checks a value against its field, by default as build/types.json
 * says; the tests put ajv there, as the reference the checker is held to.
 */
export function fromFiles({ directory, types, markets: given }: Files, fits: Fits = checker(types)): Markets {
  const byName = new Map(given.map((market) => [market.name, market]))
  const markets = new Map(
    directory.markets.map(({ name }) => {
      const market = byName.get(name)
      if (!market) throw new Error(`the directory lists ${name}, but no markets/${name}.json was given`)
      return [name, market]
    }),
  )

  return {
    directory,
    market: (name) => markets.get(name),
    checkEntry(name, role, kind, body, aboutRole) {
      const market = markets.get(name)
      if (!market) return `${name} is not a market in the directory`
      const roles = market.roles.map((r) => r.role)
      if (!roles.includes(role)) return `${role} is not a role in ${name}: its roles are ${roles.join(', ')}`
      if (!(KINDS as readonly string[]).includes(kind)) return `${kind} is not a kind of entry: the kinds are post, review, vouch and report`
      if (aboutRole !== undefined && !roles.includes(aboutRole)) return `${aboutRole} is not a role in ${name}: its roles are ${roles.join(', ')}`
      if (!isObject(body)) return `a ${kind} is an object of its fields`
      const shared = SHARED[kind as Kind]
      if (kind !== 'post' && !Object.hasOwn(body, 'subject')) return `a ${kind} names its subject: the address of the profile it is about`
      const fields: Fields = kind === 'post' ? { ...market.post, ...shared } : kind === 'review' ? { ...shared, ...market.review } : shared
      const files = filesOf(body)
      for (const [key, value] of Object.entries(body)) {
        if (key === 'files') continue
        if (!Object.hasOwn(fields, key)) return `a ${kind} in ${name} has no field ${key}`
        const field = fields[key]!
        const is = kind === 'post' ? role : aboutRole
        if (field.roles && is !== undefined && !field.roles.includes(is)) {
          return `${key} is for ${kind === 'post' ? 'posts by' : `${kind}s of`} ${field.roles.join(' or ')}`
        }
        // when: each field it names holds one of its values; a many field, any of them.
        const when = Object.entries(field.when ?? {})
        const applies = when.every(([other, values]) => {
          const held = Object.hasOwn(body, other) ? body[other] : undefined
          return (fields[other]?.many && Array.isArray(held) ? held : [held]).some((v) => values.includes(v as string))
        })
        if (!applies) return `${key} is only for a ${kind} whose ${when.map(([other, values]) => `${other} is ${or(values)}`).join(', and whose ')}`
        if (!fits(field, value)) return `${key} takes ${takes(field)}`
        if (field.type === 'file' && !(field.many ? (value as string[]) : [value]).every((sha256) => files.includes(sha256))) {
          return `${key} names a file the body's files do not list`
        }
        const means = Object.hasOwn(shared, key) ? MEANS[key] : undefined
        if (means && !means.fits.test(value as string)) return `${key} takes ${means.takes}`
      }
      return null
    },
  }
}

// The checker: build/types.json read as data, each keyword as JSON Schema means it. It knows the
// keywords types.json uses, and throws on any other when the markets load, so none is passed over;
// build/check.sh checks the rest of types.json against JSON Schema itself.

type Schema = { readonly [keyword: string]: any }

/** Each type a schema's `type` names. */
const IS: { [type: string]: (v: unknown) => boolean } = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === 'boolean',
  null: (v) => v === null,
  array: (v) => Array.isArray(v),
  object: isObject,
}

/** Whether two values are the same: lists item by item, objects key by key. */
const equal = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, i) => equal(item, b[i]))
  if (isObject(a)) {
    const keys = Object.keys(a)
    return isObject(b) && keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
  }
  return a === b
}

/** Whether no two items are the same. Text, numbers and the like go in a set, so a long list stays fast. */
const distinct = (items: unknown[]): boolean => {
  const plain = new Set<unknown>()
  const nested: unknown[] = []
  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      if (nested.some((seen) => equal(seen, item))) return false
      nested.push(item)
    } else {
      if (plain.has(item)) return false
      plain.add(item)
    }
  }
  return true
}

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(?:[Zz]|([+-])(\d{2}):(\d{2}))$/
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Whether text is a date-time as RFC 3339 writes one: a day that exists, hours to 23, minutes to 59,
 * a zone of hours to 23 and minutes to 59, and a second of 60 only in the last minute of a day in
 * UTC, when a leap second is added.
 */
const isDateTime = (text: string): boolean => {
  const parts = DATE_TIME.exec(text)
  if (!parts) return false
  const n = (i: number) => Number(parts[i] ?? 0)
  const [year, month, day, hour, minute, second, zoneHour, zoneMinute] = [n(1), n(2), n(3), n(4), n(5), n(6), n(8), n(9)]
  const days = month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : DAYS[month - 1]
  if (days === undefined || day < 1 || day > days) return false
  if (hour > 23 || minute > 59 || second >= 61 || zoneHour > 23 || zoneMinute > 59) return false
  const zone = (parts[7] === '-' ? -1 : 1) * (zoneHour * 60 + zoneMinute)
  return second < 60 || (hour * 60 + minute - zone + 1440) % 1440 === 1439
}

/** Whether a value fits build/types.json's type for a field, read as data, with no code made from it. */
export function checker(types: unknown): Fits {
  if (!isObject(types) || !isObject(types.$defs)) throw new Error('build/types.json holds no $defs')
  const root = types
  const patterns = new Map<string, RegExp>()

  /** The schema a `$ref` names, within types.json. */
  const resolve = (ref: string): Schema => {
    let schema: unknown = ref.startsWith('#/') ? root : undefined
    for (const part of ref.slice(2).split('/')) schema = isObject(schema) && Object.hasOwn(schema, part) ? schema[part] : undefined
    if (!isObject(schema)) throw new Error(`build/types.json has no ${ref}`)
    return schema
  }
  /** Whether an object holds a property: its own, and not undefined. */
  const has = (v: { [key: string]: unknown }, key: string) => Object.hasOwn(v, key) && v[key] !== undefined
  const fits = (schema: Schema, value: unknown): boolean => Object.entries(schema).every(([keyword, arg]) => KEYWORDS[keyword]!(arg, value, schema))
  const note = () => true

  /**
   * Each keyword the checker knows: whether a value fits it. A keyword about one type, such as
   * minLength about text, lets a value of another through: `type` is what rules that out.
   */
  const KEYWORDS: { [keyword: string]: (arg: any, v: any, schema: Schema) => boolean } = {
    $schema: note,
    $id: note,
    $defs: note,
    title: note,
    description: note,
    type: (type: string, v) => IS[type]!(v),
    $ref: (ref: string, v) => fits(resolve(ref), v),
    const: (c, v) => equal(c, v),
    enum: (values: unknown[], v) => values.some((c) => equal(c, v)),
    oneOf: (schemas: Schema[], v) => schemas.filter((s) => fits(s, v)).length === 1,
    minimum: (min: number, v) => typeof v !== 'number' || v >= min,
    minLength: (min: number, v) => typeof v !== 'string' || [...v].length >= min,
    maxLength: (max: number, v) => typeof v !== 'string' || [...v].length <= max,
    pattern: (pattern: string, v) => typeof v !== 'string' || patterns.get(pattern)!.test(v),
    format: (_, v) => typeof v !== 'string' || isDateTime(v),
    minItems: (min: number, v) => !Array.isArray(v) || v.length >= min,
    uniqueItems: (unique: boolean, v) => !unique || !Array.isArray(v) || distinct(v),
    items: (items: Schema, v) => !Array.isArray(v) || v.every((item) => fits(items, item)),
    required: (names: string[], v) => !isObject(v) || names.every((name) => has(v, name)),
    properties: (properties: { [name: string]: Schema }, v) =>
      !isObject(v) || Object.entries(properties).every(([name, schema]) => !has(v, name) || fits(schema, v[name])),
    additionalProperties: (_, v, schema) => !isObject(v) || Object.keys(v).every((key) => Object.hasOwn(schema.properties ?? {}, key)),
  }

  /** Every schema in types.json: each keyword one the checker knows, in a form it checks. */
  const walk = (schema: unknown, at: string): void => {
    if (!isObject(schema)) throw new Error(`build/types.json: ${at} is not a schema object`)
    for (const [keyword, arg] of Object.entries(schema)) {
      const known =
        Object.hasOwn(KEYWORDS, keyword) &&
        (keyword !== 'type' || (typeof arg === 'string' && Object.hasOwn(IS, arg))) &&
        (keyword !== 'format' || arg === 'date-time') &&
        (keyword !== 'additionalProperties' || arg === false)
      if (!known) throw new Error(`build/types.json: ${at} has ${keyword}: ${JSON.stringify(arg)}, which the checker does not know`)
    }
    if (typeof schema.pattern === 'string') patterns.set(schema.pattern, new RegExp(schema.pattern, 'u'))
    if (typeof schema.$ref === 'string') resolve(schema.$ref)
    for (const key of ['$defs', 'properties'] as const) {
      for (const [name, sub] of Object.entries(isObject(schema[key]) ? schema[key] : {})) walk(sub, `${at}/${key}/${name}`)
    }
    if (schema.items !== undefined) walk(schema.items, `${at}/items`)
    if (Array.isArray(schema.oneOf)) schema.oneOf.forEach((sub, i) => walk(sub, `${at}/oneOf/${i}`))
  }
  walk(root, '#')

  // What a field allows beyond its type: a money field, only the per it lists. An empty enum fits
  // nothing, so with no list it keeps per out.
  const allows = (field: Field): Schema =>
    field.type === 'money' ? { type: 'object', properties: { per: { enum: field.per ?? [] } } } : {}
  return (field, value) => {
    const one = field.type === 'choice' ? { type: 'string', enum: field.values } : { $ref: `#/$defs/${field.type}`, ...allows(field) }
    return fits(field.many ? { type: 'array', uniqueItems: true, items: one } : one, value)
  }
}
