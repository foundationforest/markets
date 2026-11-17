// The markets from their files, given as data, and the four answers every program shares, so an app, an
// index and a connector cannot disagree (build/README.md says each one):
//   1. checkEntry: does this entry fit?
//   2. match: do these two answers match?
//   3. read: how does this answer read, in plain English?
//   4. ask: what does this market ask this role?
// Both entries use it: index.ts reads the files from a checkout, browser.ts takes them from a page. It
// imports nothing and makes no code from strings, so it runs where a content security policy forbids
// eval. Time zones are read through Intl, which every runtime has.

/** The eight pieces: the questions any listing can answer. A field is one piece with a name. */
export const PIECES = ['text', 'choice', 'number', 'price', 'place', 'date', 'photo', 'link'] as const
export type Piece = (typeof PIECES)[number]

/** The units a number field may name: measures a program could convert. A count names none. */
export const UNITS = ['seconds', 'minutes', 'hours', 'days', 'years', 'centimetres', 'metres', 'kilometres', 'square-metres', 'grams', 'kilograms'] as const
export type Unit = (typeof UNITS)[number]

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** The ways a date's input may open: one day, from one day to another, until a day, or weekly. */
export const WAYS = ['day', 'from-to', 'until', 'weekly'] as const
export type Way = (typeof WAYS)[number]

/** Where an input opens: a place's size, a date's way and whether it asks hours, a number as a range. */
export type Start = { radiusKm?: number; way?: Way; hours?: boolean; range?: boolean }
/** The words a field asks with, for every role or for one. */
export type Words = { question?: string; hint?: string; start?: Start }
/** A field's suggestions: how to ask for it. Never checked against an entry; any program may ignore them. */
export type Ask = Words & {
  label?: string
  as?: { [role: string]: Words }
  usual?: { from?: string; to?: string }
  long?: true
  labels?: { [value: string]: string }
}

/** A field: one piece with a name. Every key but ask is a rule, checked against each entry. */
export type Field = {
  piece: Piece
  several?: true
  roles?: string[]
  when?: { [field: string]: string[] }
  /** For a choice: its own list, or the name of a shared list in build/lists.json. */
  values?: string[] | string
  unit?: Unit
  per?: string[]
  ask?: Ask
}
export type Fields = { [name: string]: Field }
export type Role = { role: string; listings: 'offers' | 'requests' }
/**
 * Live: needs no payment between people yet, is polished, and from now on only grows, on its rules.
 * Beta: works, at your own risk, and may still change in any way. A market goes from beta to live, never back.
 */
export type Status = 'live' | 'beta'
/** A market file, markets/<name>.json, as build/market.schema.json defines it. */
export type Market = {
  name: string
  summary: string
  description?: string
  status: Status
  icon?: string
  number: number
  roles: Role[]
  listing: Fields
  preview?: string[]
  review?: Fields
}
/** directory.json: every market, with what a list of markets shows. */
export type Directory = { markets: Array<Pick<Market, 'name' | 'summary' | 'description' | 'status' | 'icon' | 'number' | 'roles'>> }
/** build/lists.json: each shared list by name, each value with its English words. */
export type Lists = { [list: string]: { [value: string]: string } }
/** The files the markets are read from: directory.json, build/lists.json, and each market file the directory lists. */
export type Files = { directory: Directory; lists: Lists; markets: Market[] }

const KINDS = ['listing', 'review', 'vouch', 'report'] as const
/** The kinds of entry, each at `<kind>/<id>` in a profile's folder. */
export type Kind = (typeof KINDS)[number]

// How each piece is written, for programs that type their answers.
/** One number as decimal text, or from one to another, either end left out for no limit. */
export type NumberValue = string | { from?: string; to?: string }
export type PriceValue = { amount: string; currency: string; per?: string; count?: number }
export type PlaceValue = { lat: string; lon: string; radiusKm: number; name: string; country: string } | { country: string }
export type DateValue = ({ on: string } | { from?: string; to?: string } | { every: Weekday[]; from?: string; to?: string }) & {
  start?: string
  end?: string
  zone?: string
}

/**
 * The fields each kind holds in every market, beyond its market's: a listing's contact, and what every
 * review, vouch and report holds. A market adds fields to its reviews only, and never lists contact.
 */
export const SHARED: { [kind in Kind]: Fields } = {
  listing: {
    contact: {
      piece: 'text',
      ask: { label: 'Contact', question: 'How can people reach you outside Forest?', hint: 'A phone, a handle or an email. Anyone can read it, and the same contact on two profiles links them.' },
    },
  },
  review: {
    subject: { piece: 'text', ask: { label: 'About', question: 'Which profile is it about?' } },
    listing: { piece: 'text', ask: { label: 'Listing', question: 'Which listing was the deal?' } },
    score: { piece: 'number', ask: { label: 'Score', question: 'How did it go, from 1 to 10?', usual: { from: '1', to: '10' } } },
    text: { piece: 'text', ask: { label: 'Review', question: 'What would you tell others?', long: true } },
  },
  vouch: {
    subject: { piece: 'text', ask: { label: 'About', question: 'Which profile is it about?' } },
    text: { piece: 'text', ask: { label: 'Vouch', question: 'How do you know they are real and honest?', long: true } },
  },
  report: {
    subject: { piece: 'text', ask: { label: 'About', question: 'Which profile is it about?' } },
    text: { piece: 'text', ask: { label: 'Report', question: 'What is fake or a scam about it?', long: true } },
  },
}

/** What a shared name takes beyond its piece. */
const MEANS: { [name: string]: { fits: RegExp; takes: string } } = {
  score: { fits: /^(10(\.0)?|[1-9](\.[0-9])?)$/, takes: 'one number from "1" to "10" with at most one decimal, such as "8.5"' },
  listing: { fits: /^[^/]+\/listing\/[^/]+$/, takes: "a listing's address, <profile address>/listing/<id>" },
}

/**
 * The names of a market's listing fields that matter first, most needed first: its preview, or else
 * description, price, then its place fields, of those it has.
 */
export function previewOf(market: Market): string[] {
  const { listing } = market
  return market.preview ?? [...['description', 'price'].filter((name) => Object.hasOwn(listing, name)), ...Object.keys(listing).filter((name) => listing[name]!.piece === 'place')]
}

/** A field as the market asks it of one role, every fallback applied: question 4's answer. */
export type Asked = Field & {
  name: string
  /** Two or three words for showing a value and for a filter: its label, or else its name in words. */
  label: string
  /** The role's question, or else the field's, or else its label. */
  question: string
  hint?: string
  /** Where the input opens, for a place, a date and a number: the role's, or else the field's, over the piece's own. */
  start?: Start
  /** For a choice: each value, with how it reads. */
  choices?: Array<{ value: string; label: string }>
  /** How an answer is written, in plain words, as checkEntry says it. */
  takes: string
}
/** The day to read from, as YYYY-MM-DD: today by default, in the program's own zone. */
export type Options = { today?: string }

export type Markets = {
  /** directory.json, as the checkout holds it. */
  directory: Directory
  /** build/lists.json, as the checkout holds it. */
  lists: Lists
  /** A market's file, or undefined when the directory lists no such market. */
  market(name: string): Market | undefined
  /**
   * Why `body` does not fit as a `kind` entry by a `role` profile in `market`: the first field that
   * does not, in plain words, or null when it fits. `aboutRole` is, for a review, the role of the
   * profile it is about: a review field kept for some roles is checked against it, and not checked
   * when it is left out.
   */
  checkEntry(market: string, role: string, kind: string, body: unknown, aboutRole?: string): string | null
  /**
   * The fields `market` asks a `role` profile in a `kind` entry, in order, each with its piece, its
   * rules and its words, fallbacks applied. For a review, `aboutRole` is the role of the profile it is
   * about, which picks its fields and words. Throws on a market, role or kind that is not one.
   */
  ask(market: string, role: string, kind?: string, aboutRole?: string): Asked[]
  /**
   * Whether two answers of `field`, ones that fit, match, as build/README.md says for each piece. For a price, `a` is
   * the offer's and `b` the request's. An answer left out never blocks a match.
   */
  match(field: Field, a: unknown, b: unknown, options?: Options): boolean
  /** How an answer of `field`, one that fits, reads in plain English. */
  read(field: Field, value: unknown, options?: Options): string
}

const isObject = (v: unknown): v is { [key: string]: unknown } => typeof v === 'object' && v !== null && !Array.isArray(v)
const has = (v: { [key: string]: unknown }, key: string) => Object.hasOwn(v, key)
/** Whether an object holds only these keys. */
const only = (v: { [key: string]: unknown }, keys: readonly string[]) => Object.keys(v).every((key) => keys.includes(key))
/** A list as words do it: "a", "a or b", "a, b or c"; and with and. */
const or = (items: string[], word = 'or') => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${word} ${items.at(-1)}` : items.join(''))
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** A value's words: hyphens as spaces and a capital first letter, such as "In person" for in-person. */
export const wordsOf = (value: string) => capital(value.replaceAll('-', ' '))
/** A field's name in words, such as "Foot length" for footLength. */
export const nameWords = (name: string) => capital(name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase())

/** Whether a field takes several answers: when it says so, and a price always. */
const isSeveral = (field: Field) => field.several === true || field.piece === 'price'

/** Whether two values are the same: lists item by item, objects key by key. */
const equal = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, i) => equal(item, b[i]))
  if (isObject(a)) {
    const keys = Object.keys(a)
    return isObject(b) && keys.length === Object.keys(b).length && keys.every((key) => has(b, key) && equal(a[key], b[key]))
  }
  return a === b
}
/** Whether no two items are the same. */
const distinct = (items: unknown[]): boolean => items.every((item, i) => items.findIndex((other) => equal(other, item)) === i)

// The pieces, as each is written.

const DECIMAL = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/
const AMOUNT = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
const CURRENCY = /^[A-Z]{3}$/
const LAT = /^-?(90(\.0+)?|[1-8]?[0-9](\.[0-9]+)?)$/
const LON = /^-?(180(\.0+)?|(1[0-7][0-9]|[1-9]?[0-9])(\.[0-9]+)?)$/
const LINE = /^[^\r\n]*\S[^\r\n]*$/
const SHA256 = /^[0-9a-f]{64}$/
const LINK = /^https?:\/\/[^\s/?#]+([/?#]\S*)?$/
const DAY = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/
const TIME = /^([01][0-9]|2[0-3]):([0-5][0-9])$/
const ZONE = /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)*$/
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_MS = 86_400_000

/** A day's number: days since 1970-01-01, or NaN for text that is not a day that exists. */
const dayNumber = (text: unknown): number => {
  const parts = typeof text === 'string' ? DAY.exec(text) : null
  if (!parts) return NaN
  const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])]
  // setUTCFullYear, unlike Date.UTC, reads a year below 100 as itself.
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() / DAY_MS : NaN
}
/** A day number's year, month (1 to 12) and day of the month. */
const dateOf = (n: number) => {
  const date = new Date(n * DAY_MS)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}
/** A day number's weekday, 0 for Monday: 1970-01-01 was a Thursday. */
const weekdayOf = (n: number) => (((n + 3) % 7) + 7) % 7
/** A time of day's minutes since midnight. */
const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/** Today's number, as the options give it or in the program's own zone. */
const todayOf = (options?: Options): number => {
  if (options?.today === undefined) {
    const now = new Date()
    const date = new Date(0)
    date.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate())
    return date.getTime() / DAY_MS
  }
  const n = dayNumber(options.today)
  if (Number.isNaN(n)) throw new Error(`today is ${JSON.stringify(options.today)}, and takes a day as YYYY-MM-DD`)
  return n
}

const formats = new Map<string, Intl.DateTimeFormat | null>()
/** A formatter that gives the wall clock in `zone`, or null for a zone this runtime does not know. */
const clock = (zone: string): Intl.DateTimeFormat | null => {
  if (!formats.has(zone)) {
    let format: Intl.DateTimeFormat | null = null
    try {
      format = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    } catch {
      format = null
    }
    formats.set(zone, format)
  }
  return formats.get(zone)!
}
/** Whether a zone is a name, never an offset, that this runtime's time zone database knows. */
const isZone = (zone: unknown): zone is string => typeof zone === 'string' && ZONE.test(zone) && clock(zone) !== null
/** How many minutes `zone` is ahead of UTC at the moment `at`, in milliseconds since 1970 in UTC. */
const offsetAt = (zone: string, at: number): number => {
  const parts: { [type: string]: number } = {}
  for (const part of clock(zone)!.formatToParts(new Date(at))) parts[part.type] = Number(part.value)
  const date = new Date(0)
  date.setUTCFullYear(parts.year!, parts.month! - 1, parts.day!)
  date.setUTCHours(parts.hour!, parts.minute!, parts.second!)
  return Math.round((date.getTime() - Math.floor(at / 1000) * 1000) / 60_000)
}
/**
 * The real moment a wall clock in `zone` shows `minutes` into day `n`. In an hour the clocks skip, the
 * time the clock would show with the offset before; in one they repeat, the first.
 */
const moment = (zone: string, n: number, minutes: number): number => {
  const local = n * DAY_MS + minutes * 60_000
  const before = offsetAt(zone, local - 12 * 3_600_000)
  const after = offsetAt(zone, local + 12 * 3_600_000)
  const fits = [before, after].filter((offset) => offsetAt(zone, local - offset * 60_000) === offset)
  return local - (fits.length ? Math.max(...fits) : before) * 60_000
}

/** One answer of a field, as its piece writes it. */
const fitsOne = (field: Field, v: unknown, lists: Lists): boolean => {
  switch (field.piece) {
    case 'text':
      return typeof v === 'string'
    case 'choice':
      return typeof v === 'string' && valuesOf(field, lists).includes(v)
    case 'number':
      return isNumber(v)
    case 'price':
      return (
        isObject(v) &&
        only(v, ['amount', 'currency', 'per', 'count']) &&
        typeof v.amount === 'string' &&
        AMOUNT.test(v.amount) &&
        typeof v.currency === 'string' &&
        CURRENCY.test(v.currency) &&
        (!has(v, 'per') || (typeof v.per === 'string' && (field.per ?? []).includes(v.per))) &&
        (!has(v, 'count') || (has(v, 'per') && Number.isInteger(v.count) && (v.count as number) >= 1))
      )
    case 'place':
      return isPlace(v, lists)
    case 'date':
      return isDate(v)
    case 'photo':
      return typeof v === 'string' && SHA256.test(v)
    case 'link':
      return typeof v === 'string' && LINK.test(v)
  }
}
const isNumber = (v: unknown): boolean => {
  if (typeof v === 'string') return DECIMAL.test(v)
  if (!isObject(v) || !only(v, ['from', 'to']) || !(has(v, 'from') || has(v, 'to'))) return false
  if (![v.from, v.to].every((end) => end === undefined || (typeof end === 'string' && DECIMAL.test(end)))) return false
  return !(Number(v.from) > Number(v.to))
}
const isPlace = (v: unknown, lists: Lists): boolean => {
  if (!isObject(v) || typeof v.country !== 'string' || !Object.hasOwn(lists.countries ?? {}, v.country)) return false
  if (only(v, ['country'])) return true
  return (
    only(v, ['lat', 'lon', 'radiusKm', 'name', 'country']) &&
    typeof v.lat === 'string' &&
    LAT.test(v.lat) &&
    typeof v.lon === 'string' &&
    LON.test(v.lon) &&
    Number.isInteger(v.radiusKm) &&
    (v.radiusKm as number) >= 0 &&
    typeof v.name === 'string' &&
    LINE.test(v.name)
  )
}
const isDate = (v: unknown): boolean => {
  if (!isObject(v) || !only(v, ['on', 'from', 'to', 'every', 'start', 'end', 'zone'])) return false
  // The days: one day, from one day to another with either end left out, or weekdays every week.
  if (has(v, 'on')) {
    if (has(v, 'from') || has(v, 'to') || has(v, 'every') || Number.isNaN(dayNumber(v.on))) return false
  } else {
    if (has(v, 'every') && !(Array.isArray(v.every) && v.every.length > 0 && distinct(v.every) && v.every.every((d) => (WEEKDAYS as readonly unknown[]).includes(d)))) return false
    if (!has(v, 'every') && !has(v, 'from') && !has(v, 'to')) return false
    const [from, to] = [has(v, 'from') ? dayNumber(v.from) : -Infinity, has(v, 'to') ? dayNumber(v.to) : Infinity]
    if (Number.isNaN(from) || Number.isNaN(to) || from > to) return false
  }
  // The hours: a start, or a start and an end, with the zone they are in; or none of the three.
  if (!has(v, 'start')) return !has(v, 'end') && !has(v, 'zone')
  if (typeof v.start !== 'string' || !TIME.test(v.start) || !isZone(v.zone)) return false
  return !has(v, 'end') || (typeof v.end === 'string' && TIME.test(v.end) && v.end !== v.start)
}

/** A choice's values: its own list, or the shared list it names. */
const valuesOf = (field: Field, lists: Lists): string[] =>
  typeof field.values === 'string' ? Object.keys(Object.hasOwn(lists, field.values) ? lists[field.values]! : {}) : (field.values ?? [])
/**
 * How a choice's value reads: the field's label for it, or else its list's, as written, since either
 * may be a name such as Spanish or XL; or else its words, in lower case when not `first` in a list.
 */
const labelOf = (field: Field, value: string, lists: Lists, first = true): string => {
  const labels = field.ask?.labels
  if (labels && Object.hasOwn(labels, value)) return labels[value]!
  const list = typeof field.values === 'string' && Object.hasOwn(lists, field.values) ? lists[field.values]! : undefined
  if (list && Object.hasOwn(list, value)) return list[value]!
  return first ? wordsOf(value) : value.replaceAll('-', ' ')
}

/** How a field's answer is written, in words. */
const takes = (field: Field): string => {
  const one = (() => {
    switch (field.piece) {
      case 'text':
        return 'text'
      case 'choice':
        return typeof field.values === 'string' ? `one of the values in the ${field.values} list` : `one of ${(field.values ?? []).join(', ')}`
      case 'number':
        return 'a number as decimal text, such as "2.5", or { from, to }: two such numbers, from no more than to, either left out for no limit that way'
      case 'price':
        return field.per
          ? `{ amount, currency, per, count }: amount as decimal text, currency a code such as USD, per one of ${field.per.join(', ')} if wanted, and count, only with a per, how many of it the amount buys, a whole number`
          : '{ amount, currency }: amount as decimal text, currency a code such as USD, and no per or count'
      case 'place':
        return '{ lat, lon, radiusKm, name, country }: lat and lon as decimal text, radiusKm in whole kilometres, the place\'s name, and country a two-letter code from the countries list, such as PT; or { country } alone, for anywhere in it'
      case 'date':
        return '{ on }, { from, to } with either left out, or { every, from, to } with from and to if wanted: days as YYYY-MM-DD, from no later than to, every a list of weekdays, monday to sunday; and, if wanted, start, and end if wanted, as HH:MM, end not the same as start, with zone, a time zone by name such as Europe/Madrid'
      case 'photo':
        return 'the SHA-256 of one of the files the body lists in files, in lowercase hex'
      case 'link':
        return 'a web address, starting with https:// or http://'
    }
  })()
  return isSeveral(field) ? `a list of one or more, each different, each ${one}` : one
}

// Question 2: do two answers match?

const EARTH_KM = 6371.0088
const radians = (degrees: string) => (Number(degrees) * Math.PI) / 180
/** Whether two places meet: two circles that touch, a country and a place in it, or the same country. */
const placesMeet = (a: PlaceValue, b: PlaceValue): boolean => {
  if (!('lat' in a) || !('lat' in b)) return a.country === b.country
  const [lat1, lat2] = [radians(a.lat), radians(b.lat)]
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((radians(b.lon) - radians(a.lon)) / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h))) <= a.radiusKm + b.radiusKm
}
/** Whether two number answers overlap, a missing end limiting nothing. */
const numbersMeet = (a: NumberValue, b: NumberValue): boolean => {
  const span = (v: NumberValue) => (typeof v === 'string' ? [Number(v), Number(v)] : [v.from === undefined ? -Infinity : Number(v.from), v.to === undefined ? Infinity : Number(v.to)])
  const [[a1, a2], [b1, b2]] = [span(a), span(b)]
  return a1! <= b2! && b1! <= a2!
}

/** A date answer's first and last day numbers, an end left out as no limit. */
const daysOf = (v: DateValue): [number, number] =>
  'on' in v ? [dayNumber(v.on), dayNumber(v.on)] : [v.from === undefined ? -Infinity : dayNumber(v.from), v.to === undefined ? Infinity : dayNumber(v.to)]
/** A span of real time, [from, to) in milliseconds since 1970 in UTC; a start alone, from equal to to. */
type Span = [number, number]
/**
 * An answer's spans of real time on each of its days from day `first` to day `last`. With hours, each
 * day from its start, to its end, the next day when the end is before the start, or that moment alone;
 * with none, the whole day, in `zone` when given, else as plain days.
 */
const spansOf = (v: DateValue, first: number, last: number, zone: string | undefined): Span[] => {
  const [lo, hi] = daysOf(v)
  const spans: Span[] = []
  for (let n = Math.max(first, lo); n <= Math.min(last, hi); n++) {
    if ('every' in v && !v.every.includes(WEEKDAYS[weekdayOf(n)]!)) continue
    if (v.start !== undefined) {
      const start = moment(v.zone!, n, minutesOf(v.start))
      const end = v.end === undefined ? start : moment(v.zone!, v.end < v.start ? n + 1 : n, minutesOf(v.end))
      spans.push([start, end])
    } else {
      spans.push(zone === undefined ? [n * DAY_MS, (n + 1) * DAY_MS] : [moment(zone, n, 0), moment(zone, n + 1, 0)])
    }
  }
  return spans
}
/** Whether two spans share a moment: a start alone inside the other, or the same start alone. */
const overlap = ([a1, a2]: Span, [b1, b2]: Span): boolean => {
  if (a1 === a2 && b1 === b2) return a1 === b1
  if (a1 === a2) return b1 <= a1 && a1 < b2
  if (b1 === b2) return a1 <= b1 && b1 < a2
  return Math.max(a1, b1) < Math.min(a2, b2)
}
/**
 * Whether two date answers share a real moment. Each is turned into spans of real time through its
 * zone; an answer with no hours has no zone, and its days are read in the other's. Over the days both
 * may hold, with two on each side for zones and hours past midnight, each day is compared; when those
 * days are more than three weeks, or endless, the week of `today` among them stands for all.
 */
const datesMeet = (a: DateValue, b: DateValue, today: number): boolean => {
  const [[a1, a2], [b1, b2]] = [daysOf(a), daysOf(b)]
  const [lo, hi] = [Math.max(a1, b1), Math.min(a2, b2)]
  if (lo - hi > 4) return false
  let [first, last] = [lo - 2, hi + 2]
  if (!(hi - lo <= 21)) {
    let monday = Math.max(today - weekdayOf(today), lo)
    if (monday + 6 > hi) monday = hi - 6
    ;[first, last] = [monday - 2, monday + 8]
  }
  const [zoneA, zoneB] = [a.zone ?? b.zone, b.zone ?? a.zone]
  const spansB = spansOf(b, first, last, zoneB)
  return spansOf(a, first, last, zoneA).some((span) => spansB.some((other) => overlap(span, other)))
}
/** What one of a price's `per` costs, in its currency. */
const each = (p: PriceValue) => Number(p.amount) / (p.count ?? 1)

// Question 3: how does an answer read?

const UNIT_WORDS: { [unit in Unit]: [string, string] } = {
  seconds: ['second', 'seconds'],
  minutes: ['minute', 'minutes'],
  hours: ['hour', 'hours'],
  days: ['day', 'days'],
  years: ['year', 'years'],
  centimetres: ['centimetre', 'centimetres'],
  metres: ['metre', 'metres'],
  kilometres: ['kilometre', 'kilometres'],
  'square-metres': ['square metre', 'square metres'],
  grams: ['gram', 'grams'],
  kilograms: ['kilogram', 'kilograms'],
}
/** Decimal text with its thousands grouped, such as 1,300 for 1300. */
const figure = (text: string) => text.replace(/^(-?)([0-9]+)/, (_, sign: string, whole: string) => sign + whole.replace(/\B(?=([0-9]{3})+$)/g, ','))
/** A word's plural, by the rules English mostly keeps. */
const plural = (word: string) =>
  word === 'person' ? 'people' : /(s|x|z|ch|sh)$/.test(word) ? `${word}es` : /[^aeiou]y$/.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`
const readNumber = (v: NumberValue, unit?: Unit): string => {
  const words = unit ? UNIT_WORDS[unit] : undefined
  const withUnit = (text: string, many = true) => (words ? `${figure(text)} ${words[many ? 1 : 0]}` : figure(text))
  if (typeof v === 'string') return withUnit(v, Number(v) !== 1)
  if (v.from !== undefined && v.to !== undefined) return v.from === v.to ? withUnit(v.from, Number(v.from) !== 1) : `${figure(v.from)} to ${withUnit(v.to)}`
  return v.from !== undefined ? `${withUnit(v.from, Number(v.from) !== 1)} or more` : `up to ${withUnit(v.to!, Number(v.to) !== 1)}`
}
const readPrice = (p: PriceValue): string => {
  const cost = `${figure(p.amount)} ${p.currency}`
  if (p.per === undefined) return cost
  const per = p.per.replaceAll('-', ' ')
  return p.count !== undefined && p.count !== 1 ? `${cost} for ${p.count} ${per.replace(/\S+$/, plural)}` : `${cost} per ${per}`
}
const readPlace = (p: PlaceValue, lists: Lists): string => {
  if (!('lat' in p)) return `Anywhere in ${lists.countries?.[p.country] ?? p.country}`
  // A circle is "in or around here", never "inside this line", so it reads as around, not within.
  return p.radiusKm === 0 ? p.name : `Around ${p.name}, ${p.radiusKm} km`
}
const readTime = (time: string) => time.replace(/^0(?=[0-9]:)/, '')
const readDate = (v: DateValue, today: number): string => {
  const year = dateOf(today).year
  const day = (text: string, weekday = false) => {
    const n = dayNumber(text)
    const { year: y, month, day: d } = dateOf(n)
    return `${weekday ? `${capital(WEEKDAYS[weekdayOf(n)]!)} ` : ''}${d} ${MONTHS[month - 1]}${y === year ? '' : ` ${y}`}`
  }
  const span = (from?: string, to?: string): string => {
    if (from === undefined) return `until ${day(to!)}`
    if (to === undefined) return `from ${day(from)}`
    const [f, t] = [dateOf(dayNumber(from)), dateOf(dayNumber(to))]
    if (f.year !== t.year) return `${f.day} ${MONTHS[f.month - 1]} ${f.year} to ${t.day} ${MONTHS[t.month - 1]} ${t.year}`
    const end = `${MONTHS[t.month - 1]}${t.year === year ? '' : ` ${t.year}`}`
    return f.month === t.month ? `${f.day} to ${t.day} ${end}` : `${f.day} ${MONTHS[f.month - 1]} to ${t.day} ${end}`
  }
  const parts: string[] = []
  if ('on' in v) parts.push(day(v.on, true))
  else if ('every' in v) {
    // Weekdays in week order, three or more in a row as a run: Monday to Friday, then Saturdays.
    const days = [...v.every].map((d) => WEEKDAYS.indexOf(d)).sort((x, y) => x - y)
    const groups: number[][] = []
    for (const d of days) {
      const last = groups.at(-1)
      if (last && last.at(-1) === d - 1) last.push(d)
      else groups.push([d])
    }
    const name = (d: number) => capital(WEEKDAYS[d]!)
    parts.push(days.length === 7 ? 'Every day' : or(groups.flatMap((g) => (g.length >= 3 ? [`${name(g[0]!)} to ${name(g.at(-1)!)}`] : g.map((d) => `${name(d)}s`))), 'and'))
  } else parts.push(span(v.from, v.to))
  if (v.start !== undefined) parts.push(v.end === undefined ? readTime(v.start) : `${readTime(v.start)} to ${readTime(v.end)}`)
  if ('every' in v && (v.from !== undefined || v.to !== undefined)) parts.push(span(v.from, v.to))
  return capital(parts.join(', '))
}

// Question 4: what does a market ask a role? Each piece's own start, where its input opens.
const OWN_START: { [piece in Piece]?: Start } = { place: { radiusKm: 5 }, date: { way: 'day', hours: false }, number: { range: false } }

/** The markets in `files`. */
export function fromFiles({ directory, lists, markets: given }: Files): Markets {
  if (!isObject(lists) || !isObject(lists.countries)) throw new Error('build/lists.json holds no countries list')
  const byName = new Map(given.map((market) => [market.name, market]))
  const markets = new Map(
    directory.markets.map(({ name }) => {
      const market = byName.get(name)
      if (!market) throw new Error(`the directory lists ${name}, but no markets/${name}.json was given`)
      return [name, market]
    }),
  )
  /** A kind's fields in a market, its own and the shared ones, in the order a form asks them. */
  const fieldsOf = (market: Market, kind: Kind): Fields =>
    kind === 'listing' ? { ...market.listing, ...SHARED.listing } : kind === 'review' ? { ...SHARED.review, ...market.review } : SHARED[kind]
  /** Why the market, the role, the kind and the role reviewed are not ones, or null when each is. */
  const named = (name: string, role: string, kind: string, aboutRole?: string): string | null => {
    const market = markets.get(name)
    if (!market) return `${name} is not a market in the directory`
    const roles = market.roles.map((r) => r.role)
    if (!roles.includes(role)) return `${role} is not a role in ${name}: its roles are ${roles.join(', ')}`
    if (!(KINDS as readonly string[]).includes(kind)) return `${kind} is not a kind of entry: the kinds are listing, review, vouch and report`
    if (aboutRole !== undefined && !roles.includes(aboutRole)) return `${aboutRole} is not a role in ${name}: its roles are ${roles.join(', ')}`
    return null
  }

  return {
    directory,
    lists,
    market: (name) => markets.get(name),

    checkEntry(name, role, kind, body, aboutRole) {
      const wrong = named(name, role, kind, aboutRole)
      if (wrong) return wrong
      const market = markets.get(name)!
      if (!isObject(body)) return `a ${kind} is an object of its fields`
      if (kind !== 'listing' && !has(body, 'subject')) return `a ${kind} names its subject: the address of the profile it is about`
      const shared = SHARED[kind as Kind]
      const fields = fieldsOf(market, kind as Kind)
      const files = Array.isArray(body.files) ? body.files.map((file: unknown) => (isObject(file) ? file.sha256 : undefined)) : []
      for (const [key, value] of Object.entries(body)) {
        if (key === 'files') continue
        if (!has(fields, key)) return `a ${kind} in ${name} has no field ${key}`
        const field = fields[key]!
        const is = kind === 'listing' ? role : aboutRole
        if (field.roles && is !== undefined && !field.roles.includes(is)) {
          return `${key} is for ${kind === 'listing' ? 'listings by' : `${kind}s of`} ${field.roles.join(' or ')}`
        }
        // when: each field it names holds one of its values; a field with several, any of them.
        const when = Object.entries(field.when ?? {})
        const applies = when.every(([other, values]) => {
          const held = has(body, other) ? body[other] : undefined
          return (fields[other]?.several && Array.isArray(held) ? held : [held]).some((v) => values.includes(v as string))
        })
        if (!applies) return `${key} is only for a ${kind} whose ${when.map(([other, values]) => `${other} is ${or(values)}`).join(', and whose ')}`
        const answers = isSeveral(field) ? value : [value]
        if (!Array.isArray(answers) || answers.length === 0 || !distinct(answers) || !answers.every((v) => fitsOne(field, v, lists))) return `${key} takes ${takes(field)}`
        if (field.piece === 'photo' && !answers.every((sha256) => files.includes(sha256))) return `${key} names a file the body's files do not list`
        const means = has(shared, key) ? MEANS[key] : undefined
        if (means && !means.fits.test(value as string)) return `${key} takes ${means.takes}`
      }
      return null
    },

    ask(name, role, kind = 'listing', aboutRole) {
      const wrong = named(name, role, kind, aboutRole)
      if (wrong) throw new Error(wrong)
      const market = markets.get(name)!
      const fields = fieldsOf(market, kind as Kind)
      const who = kind === 'listing' ? role : aboutRole
      const names = Object.keys(fields).filter((key) => !fields[key]!.roles || who === undefined || fields[key]!.roles!.includes(who))
      // A listing's preview first, then the rest as the file has them; each after the fields its when names.
      const first = kind === 'listing' ? previewOf(market).filter((key) => names.includes(key)) : []
      const ordered: string[] = []
      const after = (key: string, path: string[] = []) => {
        if (ordered.includes(key) || path.includes(key)) return
        for (const other of Object.keys(fields[key]!.when ?? {})) if (names.includes(other)) after(other, [...path, key])
        ordered.push(key)
      }
      for (const key of [...first, ...names]) after(key)
      return ordered.map((key) => {
        const field = fields[key]!
        const words = who !== undefined && field.ask?.as && Object.hasOwn(field.ask.as, who) ? field.ask.as[who] : undefined
        const label = field.ask?.label ?? nameWords(key)
        const hint = words?.hint ?? field.ask?.hint
        const own = OWN_START[field.piece]
        return {
          ...field,
          name: key,
          label,
          question: words?.question ?? field.ask?.question ?? label,
          ...(hint === undefined ? {} : { hint }),
          ...(own ? { start: { ...own, ...(words?.start ?? field.ask?.start) } } : {}),
          ...(field.piece === 'choice' ? { choices: valuesOf(field, lists).map((value) => ({ value, label: labelOf(field, value, lists) })) } : {}),
          takes: takes(field),
        }
      })
    },

    match(field, a, b, options) {
      if (a === undefined || b === undefined) return true
      const [xs, ys] = isSeveral(field) ? [a as unknown[], b as unknown[]] : [[a], [b]]
      if (field.piece === 'price') {
        // Prices in different currencies, or per different things, cannot be compared: they never block.
        const pairs = (xs as PriceValue[]).flatMap((x) => (ys as PriceValue[]).filter((y) => x.currency === y.currency && x.per === y.per).map((y) => [x, y] as const))
        return pairs.length === 0 || pairs.some(([offer, request]) => each(offer) <= each(request))
      }
      const today = field.piece === 'date' ? todayOf(options) : 0
      const meet = (x: unknown, y: unknown): boolean => {
        switch (field.piece) {
          case 'choice':
            return x === y
          case 'number':
            return numbersMeet(x as NumberValue, y as NumberValue)
          case 'place':
            return placesMeet(x as PlaceValue, y as PlaceValue)
          case 'date':
            return datesMeet(x as DateValue, y as DateValue, today)
          default:
            // Text, a photo and a link are read, not matched.
            return true
        }
      }
      return xs.some((x) => ys.some((y) => meet(x, y)))
    },

    read(field, value, options) {
      const answers = isSeveral(field) ? (value as unknown[]) : [value]
      if (field.piece === 'photo') return answers.length === 1 ? '1 photo' : `${answers.length} photos`
      const today = field.piece === 'date' ? todayOf(options) : 0
      const parts = answers.map((v, i) => {
        switch (field.piece) {
          case 'choice':
            return labelOf(field, v as string, lists, i === 0)
          case 'number':
            return readNumber(v as NumberValue, field.unit)
          case 'price':
            return readPrice(v as PriceValue)
          case 'place':
            return readPlace(v as PlaceValue, lists)
          case 'date':
            return readDate(v as DateValue, today)
          default:
            return v as string
        }
      })
      const said = ['price', 'place', 'date'].includes(field.piece) ? parts.join('; ') : or(parts, 'and')
      return field.piece === 'number' ? capital(said) : said
    },
  }
}
