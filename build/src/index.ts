// The markets, read from a checkout of foundationforest/markets: the directory, each market file,
// and checkEntry, which checks a post, a review, a vouch or a report against its market as the
// manual says (build/README.md). Everything is read once, when the checkout loads, and nothing over
// the network.
//
// A body fits when each of its fields is one its market names for that kind and role, of its type
// (build/types.json), a choice among its values, `many` a list of distinct values, a `file` the
// SHA-256 of one of the body's `files`. `files` is the standard's, checked with the entry, and no
// market's field. `required` is for apps to ask for and is not enforced, except that a review, a
// vouch and a report name their subject: only it says who one is about. Whether `subject`, or the
// profile in a review's `post`, is an address is the standard's check (folders), not this one.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js'
import formats from 'ajv-formats'

export type Type = 'text' | 'number' | 'words' | 'choice' | 'place' | 'money' | 'moment' | 'file' | 'hours'
export type Field = { type: Type; description: string; values?: string[]; many?: true; required?: true; roles?: string[] }
export type Fields = { [name: string]: Field }
export type Role = { role: string; posts: 'offers' | 'requests' | 'posts' }
/** A market file, markets/<name>.json, as build/market.schema.json defines it. */
export type Market = { name: string; description: string; roles: Role[]; post: Fields; preview?: string[]; review?: Fields }
/** directory.json: every market, its description and its roles. */
export type Directory = { markets: Array<Pick<Market, 'name' | 'description' | 'roles'>> }

const KINDS = ['post', 'review', 'vouch', 'report'] as const
/** The kinds of entry, each at `<kind>/<id>` in a profile's folder. */
export type Kind = (typeof KINDS)[number]

/**
 * The fields every market's reviews, vouches and reports hold, as the manual defines them (Reviews,
 * vouches and reports). A market adds fields to its reviews only; a post's fields are all its
 * market's.
 */
export const SHARED: { [kind in Exclude<Kind, 'post'>]: Fields } = {
  review: {
    subject: { type: 'text', description: 'The address of the profile the review is about, in the same market.', required: true },
    score: { type: 'number', description: 'The rating, from "1" to "10" with at most one decimal, such as "8.5".' },
    text: { type: 'text', description: 'What the reviewer says.' },
    post: { type: 'text', description: 'The address of the post the review is about, <profile address>/post/<id>, whoever wrote it.' },
  },
  vouch: {
    subject: { type: 'text', description: 'The address of the profile the vouch is about, in the same market.', required: true },
    text: { type: 'text', description: 'Why the writer vouches for it.' },
  },
  report: {
    subject: { type: 'text', description: 'The address of the profile the report is about, in the same market.', required: true },
    text: { type: 'text', description: 'Why the writer reports it.' },
  },
}

/** What a shared name takes beyond its type. */
const MEANS: { [name: string]: { fits: RegExp; takes: string } } = {
  score: { fits: /^(10(\.0)?|[1-9](\.[0-9])?)$/, takes: 'a number from "1" to "10" with at most one decimal, such as "8.5"' },
  post: { fits: /^[^/]+\/post\/[^/]+$/, takes: "a post's address, <profile address>/post/<id>" },
}

/** What each type takes, in words. */
const TAKES: { [type in Exclude<Type, 'choice'>]: string } = {
  text: 'text',
  number: 'a number as decimal text, such as "2.5"',
  words: 'a list of short words, each different',
  place: '{ lat, lon, precisionKm, area }, lat and lon as decimal text, with online: true and reachKm if wanted; or { online: true }',
  money: '{ amount, currency, per }: amount as decimal text, currency a code such as USD, per if wanted',
  moment: 'a time in RFC 3339 with its zone, such as 2026-11-02T18:00:00+01:00, or { from, to }',
  file: 'the SHA-256 of one of the files the body lists in files, in lowercase hex',
  hours: '{ zone, slots: [{ days, from, to }] }: days as monday to sunday, times as HH:MM',
}

const takes = (field: Field) => {
  const one = field.type === 'choice' ? `one of ${field.values!.join(', ')}` : TAKES[field.type]
  return field.many ? `a list, each different, each ${one}` : one
}

const isObject = (v: unknown): v is { [key: string]: unknown } => typeof v === 'object' && v !== null && !Array.isArray(v)

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

/** The checkout this package sits in: src/ and dist/ are in build/, which is in the checkout. */
const HERE = fileURLToPath(new URL('../../', import.meta.url))

/** The markets in the checkout at `dir`, by default the one this package sits in. */
export function loadMarkets(dir: string = HERE): Markets {
  const read = (path: string): unknown => JSON.parse(readFileSync(join(dir, path), 'utf8'))
  const directory = read('directory.json') as Directory
  const types = read('build/types.json') as { $id: string }
  const markets = new Map(directory.markets.map(({ name }) => [name, read(`markets/${name}.json`) as Market]))

  const ajv = new Ajv2020({ strict: true })
  formats.default(ajv)
  ajv.addSchema(types)
  const compiled = new Map<string, ValidateFunction>()
  /** A field's schema: its type from types.json, a choice's values, a list of distinct ones when `many`. */
  const validator = (field: Field): ValidateFunction => {
    const key = JSON.stringify([field.type, field.values, field.many])
    let validate = compiled.get(key)
    if (!validate) {
      const one = field.type === 'choice' ? { type: 'string', enum: field.values } : { $ref: `${types.$id}#/$defs/${field.type}` }
      validate = ajv.compile(field.many ? { type: 'array', uniqueItems: true, items: one } : one)
      compiled.set(key, validate)
    }
    return validate
  }

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
      const shared: Fields = kind === 'post' ? {} : SHARED[kind as Exclude<Kind, 'post'>]
      if (kind !== 'post' && !Object.hasOwn(body, 'subject')) return `a ${kind} names its subject: the address of the profile it is about`
      const fields: Fields = kind === 'post' ? market.post : kind === 'review' ? { ...shared, ...market.review } : shared
      const files = filesOf(body)
      for (const [key, value] of Object.entries(body)) {
        if (key === 'files') continue
        if (!Object.hasOwn(fields, key)) return `a ${kind} in ${name} has no field ${key}`
        const field = fields[key]!
        const is = kind === 'post' ? role : aboutRole
        if (field.roles && is !== undefined && !field.roles.includes(is)) {
          return `${key} is for ${kind === 'post' ? 'posts by' : `${kind}s of`} ${field.roles.join(' or ')}`
        }
        if (!validator(field)(value)) return `${key} takes ${takes(field)}`
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
