// The package on the test market, knitting.json, which holds every type and every key a field may
// hold: checkEntry for each kind, with the answers it gives in words, and the rest the package
// exports. The test market is read from a checkout of its own, with this checkout's build/types.json,
// so these tests hold whatever markets/ holds. Each case runs on both entries and on ajv, the check
// the package made before its own checker, as the reference: all three must agree, but on the
// answers ajv got wrong, each with its own test. content.test.ts tests the markets in markets/.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js'
import formats from 'ajv-formats'
import { loadMarkets as loadGiven, previewOf as previewGiven, type Files } from '../src/browser.ts'
import { COLORS, SHARED, UNITS, loadMarkets, previewOf, type Directory, type Market, type Markets } from '../src/index.ts'
import { fromFiles } from '../src/markets.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const knitting: Market = JSON.parse(readFileSync(new URL('knitting.json', import.meta.url), 'utf8'))

/** The test market's files, and a checkout of them alone, for the Node entry to read. */
const directory: Directory = {
  markets: [{ name: knitting.name, summary: knitting.summary, description: knitting.description, status: knitting.status, icon: knitting.icon, color: knitting.color, roles: knitting.roles }],
}
const files: Files = { directory, types: json('build/types.json'), markets: [knitting] }
const checkout = mkdtempSync(join(tmpdir(), 'markets-'))
after(() => rmSync(checkout, { recursive: true, force: true }))
for (const path of ['build', 'markets']) mkdirSync(join(checkout, path))
copyFileSync(join(ROOT, 'build/types.json'), join(checkout, 'build/types.json'))
writeFileSync(join(checkout, 'directory.json'), JSON.stringify(directory))
writeFileSync(join(checkout, 'markets/knitting.json'), JSON.stringify(knitting))
const markets = loadMarkets(checkout)
const browser = loadGiven(files)

/** The markets with each value checked by ajv, as src/index.ts compiled it before the checker. */
const reference = (() => {
  const types = files.types as { $id: string }
  const ajv = new Ajv2020({ strict: true })
  formats.default(ajv)
  ajv.addSchema(types)
  const compiled = new Map<string, ValidateFunction>()
  return fromFiles(files, (field, value) => {
    const key = JSON.stringify([field.type, field.values, field.per, field.many, field.range])
    let validate = compiled.get(key)
    if (!validate) {
      const allows = field.type === 'money' ? { type: 'object', properties: { per: field.per ? { enum: field.per } : false } } : {}
      const ref = (type: string) => ({ $ref: `${types.$id}#/$defs/${type}` })
      const one =
        field.type === 'choice'
          ? { type: 'string', enum: field.values }
          : field.type === 'number' && field.range
            ? { oneOf: [ref('number'), ref('number/$defs/range')] }
            : { ...ref(field.type), ...allows }
      validate = ajv.compile(field.many ? { type: 'array', uniqueItems: true, items: one } : one)
      compiled.set(key, validate)
    }
    return validate(value)
  })
})()

/** Every case the tests ask both entries, for the last test to ask again with code from strings disallowed. */
const cases: Parameters<Markets['checkEntry']>[] = []

/** checkEntry from the Node entry and the browser entry, which must answer the same. */
const both: Markets['checkEntry'] = (...args) => {
  const answer = markets.checkEntry(...args)
  const given = browser.checkEntry(...args)
  assert.equal(given, answer, `${JSON.stringify(args)}: the browser entry answers ${given}, the Node entry ${answer}`)
  cases.push(args)
  return answer
}

/** checkEntry from both entries, which ajv must answer the same too. */
const check: Markets['checkEntry'] = (...args) => {
  const answer = both(...args)
  const before = reference.checkEntry(...args)
  assert.equal(before, answer, `${JSON.stringify(args)}: ajv answers ${before}, the entries ${answer}`)
  return answer
}

const K = 'knitting'
const subject = '9bpPbLYCPwNWq9BZqnJr3EqRNqymFZ4g58Zk9K86azDC'
const photo = { sha256: '04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86', type: 'image/jpeg', size: 48213 }
const place = { lat: '40.42', lon: '-3.70', radiusKm: 5, area: 'Madrid' }
const price = { amount: '30', currency: 'USD', per: 'hour' }
const inPerson = { handover: ['in-person'] }
const kids = { wearer: ['children'] }

test('the package reads a checkout: this one, by default or named, and the test market', () => {
  const here = loadMarkets()
  assert.deepEqual(here.directory, json('directory.json'))
  for (const { name } of here.directory.markets) assert.deepEqual(here.market(name), json(`markets/${name}.json`))
  assert.deepEqual(loadMarkets(ROOT).directory, here.directory)
  assert.deepEqual(markets.directory, directory)
  assert.deepEqual(markets.market(K), knitting)
  assert.equal(markets.market('weaving'), undefined)
})

test("a listing fits when each field is its market's, of its type", () => {
  assert.equal(check(K, 'knitter', 'listing', { description: 'Jumpers to order', price: [price], wearer: ['women', 'men'], kind: 'jumper', size: 'm', ...inPerson, studio: place }), null)
  assert.equal(check(K, 'client', 'listing', { description: 'A hat for my son', ...kids, age: { from: '9', to: '11' }, kind: 'hat' }), null)
  assert.equal(check(K, 'client', 'listing', { description: 'A scarf', due: '2026-11-02T18:00:00+01:00', kind: 'scarf', handover: ['shipped'] }), null)
  assert.equal(check(K, 'knitter', 'listing', { yarns: ['merino', 'cotton'], days: '14' }), null)
  assert.equal(check(K, 'knitter', 'listing', { hours: { zone: 'Europe/Madrid', slots: [{ days: ['monday'], from: '09:00', to: '17:00' }] } }), null)
})

test('a listing may leave out any field', () => {
  assert.equal(check(K, 'knitter', 'listing', {}), null)
  assert.equal(check(K, 'knitter', 'listing', { kind: 'hat' }), null)
})

test('every listing may hold contact, which no market lists', () => {
  assert.equal(Object.hasOwn(knitting.listing, 'contact'), false)
  for (const { role } of knitting.roles) assert.equal(check(K, role, 'listing', { contact: '+34 600 000 000' }), null)
  assert.equal(check(K, 'knitter', 'listing', { contact: ['+34 600 000 000'] }), 'contact takes text')
  assert.equal(check(K, 'knitter', 'review', { subject, contact: 'x' }), 'a review in knitting has no field contact')
})

test('the market, the roles, the kind and the body are named before any field', () => {
  assert.equal(check('weaving', 'weaver', 'listing', {}), 'weaving is not a market in the directory')
  assert.equal(check(K, 'seller', 'listing', {}), 'seller is not a role in knitting: its roles are knitter, client')
  assert.equal(check(K, 'knitter', 'offer', {}), 'offer is not a kind of entry: the kinds are listing, review, vouch and report')
  assert.equal(check(K, 'knitter', 'review', { subject }, 'seller'), 'seller is not a role in knitting: its roles are knitter, client')
  assert.equal(check(K, 'knitter', 'listing', null), 'a listing is an object of its fields')
  assert.equal(check(K, 'knitter', 'listing', ['hat']), 'a listing is an object of its fields')
})

test('a field its market does not name does not fit, nor one Object gives every object', () => {
  assert.equal(check(K, 'knitter', 'listing', { description: 'Hats', colour: 'red' }), 'a listing in knitting has no field colour')
  assert.equal(check(K, 'knitter', 'listing', { constructor: 'x' }), 'a listing in knitting has no field constructor')
  assert.equal(check(K, 'knitter', 'listing', JSON.parse('{ "__proto__": "x" }')), 'a listing in knitting has no field __proto__')
})

test('each value is of its type: a choice among its values, many a list of distinct values', () => {
  assert.equal(check(K, 'knitter', 'listing', { deposit: { amount: 30, currency: 'USD' } }), 'deposit takes { amount, currency }: amount as decimal text, currency a code such as USD, and no per or count')
  assert.equal(check(K, 'knitter', 'listing', { wearer: ['dogs'] }), 'wearer takes a list, each different, each one of women, men, children')
  assert.match(check(K, 'knitter', 'listing', { wearer: ['women', 'women'] })!, /^wearer takes a list, each different/)
  assert.match(check(K, 'knitter', 'listing', { wearer: 'women' })!, /^wearer takes a list/)
  assert.equal(check(K, 'knitter', 'listing', { kind: 'shawl' }), 'kind takes one of jumper, cardigan, scarf, hat, socks')
  assert.equal(check(K, 'knitter', 'listing', { days: 14 }), 'days takes a number as decimal text, such as "2.5"')
  assert.equal(check(K, 'knitter', 'listing', { yarns: ['merino', 'merino'] }), 'yarns takes a list of short words, each different')
  assert.match(check(K, 'client', 'listing', { due: '2026-11-02 18:00' })!, /^due takes a time in RFC 3339/)
})

test('money takes a per its field lists, or none for the whole deal, and a count only with a per; with no list, neither', () => {
  for (const per of ['item', 'hour']) assert.equal(check(K, 'knitter', 'listing', { price: [{ ...price, per }] }), null)
  assert.equal(check(K, 'knitter', 'listing', { price: [{ amount: '300', currency: 'USD' }] }), null)
  assert.equal(check(K, 'knitter', 'listing', { price: [{ ...price, count: 1 }] }), null)
  const each = 'price takes a list of one or more, each different, each { amount, currency, per, count }: amount as decimal text, currency a code such as USD, per one of item, hour if wanted, and count, only with a per, how many of it the amount buys, a whole number'
  for (const wrong of [{ ...price, per: 'night' }, { amount: '300', currency: 'USD', count: 2 }, { ...price, count: 0 }, { ...price, count: 1.5 }, { ...price, count: '5' }]) {
    assert.equal(check(K, 'knitter', 'listing', { price: [wrong] }), each)
  }
  const noPer = 'deposit takes { amount, currency }: amount as decimal text, currency a code such as USD, and no per or count'
  assert.equal(check(K, 'knitter', 'listing', { deposit: { amount: '40', currency: 'EUR' } }), null)
  assert.equal(check(K, 'knitter', 'listing', { deposit: { amount: '40', currency: 'EUR', per: 'item' } }), noPer)
  assert.equal(check(K, 'knitter', 'listing', { deposit: { amount: '40', currency: 'EUR', count: 2 } }), noPer)
})

test("a listing's price is always a list of one or more, each different, a pack with its count, though no market writes many", () => {
  assert.equal(knitting.listing.price!.many, undefined)
  // A pair of socks for 35, 3 pairs for 90, and 300 for the whole order.
  const socks = [{ amount: '35', currency: 'EUR', per: 'item' }, { amount: '90', currency: 'EUR', per: 'item', count: 3 }, { amount: '300', currency: 'EUR' }]
  assert.equal(check(K, 'knitter', 'listing', { price: socks }), null)
  assert.equal(check(K, 'client', 'listing', { price: [{ amount: '100', currency: 'EUR', per: 'item', count: 3 }] }), null)
  const each = /^price takes a list of one or more, each different, each \{ amount, currency, per, count \}/
  for (const wrong of [price, [], [price, { ...price }], null]) assert.match(check(K, 'knitter', 'listing', { price: wrong })!, each)
  // Only price, of a listing: another money field holds one amount, unless its market makes it many.
  assert.match(check(K, 'knitter', 'listing', { deposit: [{ amount: '40', currency: 'EUR' }] })!, /^deposit takes \{ amount, currency \}/)
})

test('a number that allows a range takes one number, or from and to, either left out for no limit that way', () => {
  for (const age of ['10', { from: '9', to: '11' }, { from: '9', to: '9' }, { from: '13' }, { to: '6' }, { from: '0.5', to: '2' }, { from: '-1', to: '1' }]) {
    assert.equal(check(K, 'client', 'listing', { ...kids, age }), null)
  }
  const takes = 'age takes a number as decimal text, such as "2.5", or { from, to }: two such numbers, from no more than to, either left out for no limit that way'
  for (const age of [{}, { from: '11', to: '9' }, { from: '10', to: '9.5' }, { from: 9, to: 11 }, { from: '9', to: '11', step: '1' }, { low: '9', high: '11' }, ['9', '11'], '9-11', 10]) {
    assert.equal(check(K, 'client', 'listing', { ...kids, age }), takes)
  }
  assert.equal(check(K, 'knitter', 'listing', { days: { from: '10', to: '14' } }), 'days takes a number as decimal text, such as "2.5"')
  assert.equal(check(K, 'client', 'listing', { wearer: ['women'], age: '30' }), 'age is only for a listing whose wearer is children')
})

test('a span runs from no later than to, each in its own zone', () => {
  const span = (from: string, to: string) => check(K, 'client', 'listing', { due: { from, to } })
  const takes = 'due takes a time in RFC 3339 with its zone, such as 2026-11-02T18:00:00+01:00, or { from, to }, from no later than to'
  assert.equal(span('2026-11-02T18:00:00Z', '2026-11-02T20:00:00Z'), null)
  assert.equal(span('2026-11-02T18:00:00Z', '2026-11-02T18:00:00Z'), null)
  assert.equal(span('2026-11-02T19:00:00+01:00', '2026-11-02T18:00:00Z'), null)
  assert.equal(span('2026-11-02T18:30:00+01:00', '2026-11-02T18:00:00Z'), null)
  assert.equal(span('2026-11-02T20:00:00Z', '2026-11-02T18:00:00Z'), takes)
  assert.equal(span('2026-11-02T18:00:00Z', '2026-11-02T18:30:00+01:00'), takes)
  assert.equal(span('2026-11-02T18:00:00.5Z', '2026-11-02T18:00:00.25Z'), takes)
  // A leap second ends where the next minute starts; a year below 100 is that year.
  assert.equal(span('2026-12-31T23:59:60Z', '2027-01-01T00:00:00Z'), null)
  assert.equal(span('2027-01-01T00:00:00.5Z', '2026-12-31T23:59:60Z'), takes)
  assert.equal(span('0099-01-01T00:00:00Z', '0100-01-01T00:00:00Z'), null)
  assert.equal(span('0100-01-01T00:00:00Z', '0099-01-01T00:00:00Z'), takes)
})

test('each span in a list runs forward too', () => {
  const listing = { ...knitting.listing, free: { type: 'moment', description: 'When the knitter can take an order.', many: true } } as const
  const free = loadGiven({ ...files, markets: [{ ...knitting, listing }] })
  const forward = { from: '2026-11-02T18:00:00Z', to: '2026-11-03T18:00:00Z' }
  assert.equal(free.checkEntry(K, 'knitter', 'listing', { free: [forward, '2026-12-01T09:00:00Z'] }), null)
  assert.match(free.checkEntry(K, 'knitter', 'listing', { free: [forward, { from: forward.to, to: forward.from }] })!, /^free takes a list, each different, each a time in RFC 3339 .* from no later than to$/)
})

test('a place is a point and a radius, with an area name if wanted', () => {
  const { area, ...point } = place
  for (const at of [place, point, { ...place, radiusKm: 0 }]) {
    assert.equal(check(K, 'knitter', 'listing', { ...inPerson, studio: at }), null)
    assert.equal(check(K, 'client', 'listing', { ...inPerson, home: at }), null)
  }
  const takes = 'studio takes { lat, lon, radiusKm, area }: lat and lon as decimal text, radiusKm in whole kilometres, and area a name if wanted'
  const before = [{ area }, { area, reachKm: 10 }, { area, lat: '40.42', lon: '-3.70' }, { area, lat: '40.42', lon: '-3.70', reachKm: 10 }]
  for (const at of [...before, { ...place, radiusKm: 1.5 }, { ...place, radiusKm: -1 }, { ...place, online: true }, { lat: '40.42', radiusKm: 5 }]) {
    assert.equal(check(K, 'knitter', 'listing', { ...inPerson, studio: at }), takes)
  }
})

test("previewOf gives a market's preview, or else description, price, then its place fields, of those it has", () => {
  assert.deepEqual(previewOf(knitting), knitting.preview)
  const { preview: _preview, ...none } = knitting
  assert.deepEqual(previewOf(none), ['description', 'price', 'studio', 'home'])
  const { price: _price, ...unpriced } = knitting.listing
  assert.deepEqual(previewOf({ ...none, listing: unpriced }), ['description', 'studio', 'home'])
  assert.equal(previewGiven, previewOf)
})

test('a field kept for some roles fits only a listing by one of them: a place split by role', () => {
  assert.equal(check(K, 'client', 'listing', { ...inPerson, studio: place }), 'studio is for listings by knitter')
  assert.equal(check(K, 'knitter', 'listing', { ...inPerson, home: place }), 'home is for listings by client')
  assert.equal(check(K, 'client', 'listing', { photos: [] }), 'photos is for listings by knitter')
  assert.equal(check(K, 'knitter', 'listing', { photos: [] }), null)
  assert.equal(check(K, 'knitter', 'listing', { due: '2026-11-02T18:00:00+01:00' }), 'due is for listings by client')
})

test('a field with when is held only where the fields it names hold one of its values', () => {
  const socks = 'footLength is only for a listing whose kind is socks'
  assert.equal(check(K, 'knitter', 'listing', { kind: 'socks', footLength: '24.5' }), null)
  assert.equal(check(K, 'knitter', 'listing', { kind: 'hat', footLength: '24.5' }), socks)
  assert.equal(check(K, 'knitter', 'listing', { footLength: '24.5' }), socks)
  assert.equal(check(K, 'knitter', 'listing', { footLength: '24.5', kind: 'socks' }), null)
})

test('with several fields named, all must match; a many field matches when any of its values does', () => {
  const adult = { kind: 'jumper', size: 'm' }
  const sized = 'size is only for a listing whose wearer is women or men, and whose kind is jumper or cardigan'
  assert.equal(check(K, 'knitter', 'listing', { ...adult, wearer: ['women', 'men'] }), null)
  assert.equal(check(K, 'knitter', 'listing', { ...adult, wearer: ['men', 'children'] }), null)
  assert.equal(check(K, 'knitter', 'listing', { ...adult, wearer: ['children'] }), sized)
  assert.equal(check(K, 'knitter', 'listing', { wearer: ['women'], kind: 'scarf', size: 'm' }), sized)
  assert.equal(check(K, 'knitter', 'listing', { wearer: 'women', kind: 'jumper', size: 'm' }), 'wearer takes a list, each different, each one of women, men, children')
})

test('a place asked only in person: shipped alone holds no place', () => {
  for (const [role, key] of [['knitter', 'studio'], ['client', 'home']] as const) {
    assert.equal(check(K, role, 'listing', { ...inPerson, [key]: place }), null)
    assert.equal(check(K, role, 'listing', { handover: ['shipped', 'in-person'], [key]: place }), null)
    assert.equal(check(K, role, 'listing', { handover: ['shipped'] }), null)
    assert.equal(check(K, role, 'listing', { handover: ['shipped'], [key]: place }), `${key} is only for a listing whose handover is in-person`)
    assert.equal(check(K, role, 'listing', { [key]: place }), `${key} is only for a listing whose handover is in-person`)
  }
})

test('a field with roles and when holds only where both match, in a listing and in a review', () => {
  assert.equal(check(K, 'client', 'listing', { ...inPerson, home: place }), null)
  assert.equal(check(K, 'client', 'listing', { handover: ['shipped'], home: place }), 'home is only for a listing whose handover is in-person')
  assert.equal(check(K, 'client', 'review', { subject, onTime: 'no', daysLate: '2' }, 'knitter'), null)
  assert.equal(check(K, 'client', 'review', { subject, onTime: 'yes', daysLate: '2' }, 'knitter'), 'daysLate is only for a review whose onTime is no')
  assert.equal(check(K, 'knitter', 'review', { subject, daysLate: '2' }, 'client'), 'daysLate is for reviews of knitter')
})

test('the first field that does not fit is the one answered', () => {
  assert.equal(check(K, 'knitter', 'listing', { colour: 'red', wearer: ['dogs'] }), 'a listing in knitting has no field colour')
})

test("a file field names one of the body's files", () => {
  assert.equal(check(K, 'knitter', 'listing', { description: 'A wool jumper.', photos: [photo.sha256], files: [photo] }), null)
  assert.equal(check(K, 'knitter', 'listing', { photos: [photo.sha256] }), "photos names a file the body's files do not list")
  assert.match(check(K, 'knitter', 'listing', { photos: [photo], files: [photo] })!, /^photos takes a list, each different, each the SHA-256/)
  assert.equal(check(K, 'client', 'listing', { description: 'A hat like this', files: [photo] }), null)
})

test('a review holds the fields every review holds, and its market adds others', () => {
  const listing = `${subject}/listing/jumper`
  assert.equal(check(K, 'client', 'review', { subject, score: '8.5', text: 'Warm and well made.', listing }), null)
  assert.equal(check(K, 'client', 'review', { subject }), null)
  for (const score of ['1', '10', '10.0', '9.5']) assert.equal(check(K, 'client', 'review', { subject, score }), null)
  for (const score of ['0', '11', '8.55', '0.5', '-1']) {
    assert.equal(check(K, 'client', 'review', { subject, score }), 'score takes a number from "1" to "10" with at most one decimal, such as "8.5"')
  }
  assert.equal(check(K, 'client', 'review', { subject, score: 8 }), 'score takes a number as decimal text, such as "2.5"')
  for (const wrong of ['jumper', `${subject}/offer/jumper`, `${subject}/post/jumper`, `${subject}/listing/`, `${subject}/listing/a/b`]) {
    assert.equal(check(K, 'client', 'review', { subject, listing: wrong }), "listing takes a listing's address, <profile address>/listing/<id>")
  }
  assert.equal(check(K, 'client', 'review', { subject, post: listing }), 'a review in knitting has no field post')
  assert.equal(check(K, 'client', 'review', { subject, evidence: 'x' }), 'a review in knitting has no field evidence')
  assert.equal(check(K, 'client', 'review', { subject, kind: 'hat' }), 'a review in knitting has no field kind')
  for (const { role } of knitting.roles) assert.equal(check(K, role, 'review', { subject, again: 'yes' }, role), null)
})

test('subject is the one field enforced: a review, a vouch and a report name it', () => {
  for (const kind of ['review', 'vouch', 'report']) {
    assert.equal(check(K, 'client', kind, { text: 'x' }), `a ${kind} names its subject: the address of the profile it is about`)
  }
  assert.equal(check(K, 'client', 'review', { subject: 7 }), 'subject takes text')
})

test('a review field kept for some roles fits only a review of one of them, when that role is known', () => {
  assert.equal(check(K, 'knitter', 'review', { subject, onTime: 'yes' }, 'client'), 'onTime is for reviews of knitter')
  assert.equal(check(K, 'client', 'review', { subject, onTime: 'yes', again: 'no' }, 'knitter'), null)
  assert.equal(check(K, 'knitter', 'review', { subject, onTime: 'yes' }), null)
  assert.equal(check(K, 'client', 'review', { subject, onTime: 'late' }, 'knitter'), 'onTime takes one of yes, no')
})

test('a vouch and a report hold subject and text, the same in every market', () => {
  assert.equal(check(K, 'knitter', 'vouch', { subject, text: 'Real and honest.' }), null)
  assert.equal(check(K, 'client', 'report', { subject }, 'knitter'), null)
  assert.equal(check(K, 'knitter', 'vouch', { subject, score: '9' }), 'a vouch in knitting has no field score')
  assert.equal(check(K, 'client', 'report', { subject, onTime: 'no' }), 'a report in knitting has no field onTime')
})

test("the shared fields are of types.json's types, and the schema keeps a listing's and a review's names for them and lists the package's units and colors", () => {
  const types = Object.keys(json('build/types.json').$defs)
  for (const fields of Object.values(SHARED)) for (const field of Object.values(fields)) assert.ok(types.includes(field.type))
  const schema = json('build/market.schema.json')
  for (const kind of ['listing', 'review'] as const) assert.deepEqual(schema.properties[kind].propertyNames.not.enum, Object.keys(SHARED[kind]))
  assert.deepEqual(schema.$defs.field.properties.unit.enum, [...UNITS])
  assert.deepEqual(schema.properties.color.enum, [...COLORS])
})

test('values at the edges of each type answer as ajv answers them', () => {
  const hash = photo.sha256
  const at = (time: string) => `2026-11-02T${time}`
  const hours = (slot: object, zone = 'Europe/Madrid') => ({ zone, slots: [{ days: ['monday'], from: '09:00', to: '17:00', ...slot }] })
  const places = [
    place, { ...place, radiusKm: 0 }, { lat: '40.42', lon: '-3.70', radiusKm: 5 }, { ...place, radiusKm: 20000 }, { ...place, online: true },
    { area: 'Madrid' }, { area: 'Madrid', reachKm: 5 }, { area: 'Madrid', lat: '40.42', lon: '-3.70' }, { ...place, reachKm: 5 },
    { lat: '40.42', radiusKm: 5 }, { lon: '-3.70', radiusKm: 5 }, { lat: '40.42', lon: '-3.70' }, { radiusKm: 5 }, { ...place, radiusKm: null },
    { ...place, radiusKm: -1 }, { ...place, radiusKm: 0.5 }, { ...place, radiusKm: 1.0 }, { ...place, radiusKm: '5' }, { ...place, precisionKm: 1 },
    { ...place, lat: '90', lon: '180' }, { ...place, lat: '90.1', lon: '0' }, { ...place, lat: '-90.0', lon: '-180.00' }, { ...place, lon: '180.5' },
    { ...place, lat: '+40' }, { ...place, lat: 40.42 }, { ...place, area: '' }, { ...place, area: '😀' }, { ...place, area: 7 },
    { ...place, extra: 1 }, {}, [], 'Madrid',
  ]
  const prices = [
    { amount: '0', currency: 'EUR' }, { amount: '12.50', currency: 'USD', per: 'hour' }, { amount: '12.50', currency: 'USD', per: 'item' },
    { amount: '12.50', currency: 'USD', per: 'night' }, { amount: '01', currency: 'USD' },
    { amount: '-1', currency: 'USD' }, { amount: '1.', currency: 'USD' }, { amount: '1', currency: 'usd' }, { amount: '1', currency: 'USDT' },
    { amount: '1', currency: 'USD', per: '' }, { amount: '1', currency: 'USD', per: 7 }, { currency: 'USD' }, { amount: '1' },
    { amount: '1', currency: 'USD', each: 'x' }, '30 USD',
    { amount: '90', currency: 'USD', per: 'item', count: 3 }, { amount: '90', currency: 'USD', per: 'item', count: 1 },
    { amount: '90', currency: 'USD', count: 3 }, { amount: '90', currency: 'USD', per: 'item', count: 0 },
    { amount: '90', currency: 'USD', per: 'item', count: -1 }, { amount: '90', currency: 'USD', per: 'item', count: 1.5 },
    { amount: '90', currency: 'USD', per: 'item', count: 1.0 }, { amount: '90', currency: 'USD', per: 'item', count: '3' },
    { amount: '90', currency: 'USD', per: 'item', count: null },
  ]
  const lists = [...prices.map((one) => [one]), [], [prices[0], prices[0]], [prices[0], prices[1], prices[15]], prices[1]]
  const ages = [
    '10', '-1', '1.5', 10, { from: '9', to: '11' }, { from: '9', to: '9' }, { from: '11', to: '9' }, { from: '9' }, { to: '6' }, {},
    { from: '9', to: null }, { from: 9 }, { from: '09' }, { from: '9', to: '11', step: '1' }, { from: '9', to: '1e1' }, ['9', '11'], '9-11', null,
  ]
  const edges: [role: string, field: string, context: object, values: unknown[]][] = [
    ['knitter', 'contact', {}, ['', 'x', 7, null, ['x'], {}]],
    ['knitter', 'days', {}, ['0', '-0', '01', '2.', '-2.5', '1e3', ' 1', '١٢', 2]],
    ['knitter', 'yarns', {}, [
      [], ['a'], [''], ['__proto__'], ['a'.repeat(64)], ['a'.repeat(65)], ['😀'.repeat(64)], ['😀'.repeat(65)], ['a\nb'],
      ['toString', 'toString'], ['constructor', 'constructor'], ['a', 'b', 'a'], [1, 1], [['a'], ['a']], 'a',
    ]],
    ['knitter', 'wearer', {}, [['women', 'women'], ['women', 'men'], [], 'women', ['Women'], [null]]],
    ['knitter', 'kind', {}, ['hat', 'HAT', ['hat'], 1]],
    ['knitter', 'studio', inPerson, places],
    ['client', 'home', inPerson, places],
    ['knitter', 'price', {}, lists],
    ['knitter', 'deposit', {}, prices],
    ['client', 'age', kids, ages],
    ['client', 'due', {}, [
      '2024-02-29T00:00:00Z', '2026-02-29T00:00:00Z', '2000-02-29T12:00:00Z', '1900-02-29T12:00:00Z', '2026-04-31T00:00:00Z',
      '2026-04-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-00-10T00:00:00Z', '2026-01-00T00:00:00Z', '0000-01-01T00:00:00Z',
      '2026-12-31T23:59:60Z', '2026-12-31T23:59:60.5Z', '2026-12-31T23:59:61Z', '2027-01-01T00:59:60+01:00', '2026-12-31T22:59:60-01:00',
      '2027-01-01T00:00:60+00:01', '2026-12-31T23:30:60-00:29', at('12:00:60Z'), at('23:59:60+00:00'), at('23:59:60-00:01'),
      at('00:00:00Z'), at('23:59:59Z'), at('23:00:00+23:59'), at('23:00:00+24:00'), at('23:00:00-00:60'), at('18:00:00.123+01:00'),
      at('18:00:00.+01:00'), '2026-11-02t18:00:00z', '2026-11-02 18:00:00Z', at('18:00:00'), at('18:00Z'), at('18:00:00+0100'),
      { from: at('18:00:00Z'), to: at('20:00:00Z') }, { from: at('18:00:00Z') }, { from: at('18:00:00Z'), to: at('20:00:00Z'), at: 'x' },
      { from: at('18:00:00Z'), to: at('24:00:00Z') }, 1762106400,
      { from: at('20:00:00Z'), to: at('18:00:00Z') }, { from: at('19:00:00+01:00'), to: at('18:00:00Z') },
      { from: at('18:00:00.5Z'), to: at('18:00:00Z') }, { from: '2026-12-31T23:59:60Z', to: '2027-01-01T00:00:00Z' },
    ]],
    ['knitter', 'hours', {}, [
      hours({}), hours({}, 'UTC'), hours({}, 'Etc/GMT+1'), hours({}, 'America/Argentina/Buenos_Aires'), hours({}, '/Madrid'),
      hours({}, 'Europe//Madrid'), hours({}, ''), hours({ days: ['monday', 'monday'] }), hours({ days: [] }), hours({ days: ['Monday'] }),
      hours({ days: ['monday', 'sunday'] }), hours({ from: '24:00' }), hours({ from: '9:00' }), hours({ to: '23:59' }), hours({ to: '23:60' }),
      hours({ extra: 1 }), { zone: 'Europe/Madrid', slots: [] }, { zone: 'Europe/Madrid', slots: [{ days: ['monday'], from: '09:00' }] },
      { zone: 'Europe/Madrid' }, { slots: [] }, { ...hours({}), extra: 1 },
    ]],
    ['knitter', 'photos', {}, [
      [hash], [hash.toUpperCase()], [hash.slice(1)], [`${hash}0`], [hash, hash], [], hash,
      [{ valueOf: 1 }, { valueOf: 1 }], [{ toString: 1 }, { toString: 1 }], [{ constructor: {} }, { constructor: {} }],
    ]],
  ]
  for (const [role, field, context, values] of edges) for (const value of values) check(K, role, 'listing', { ...context, [field]: value })
})

test('a word twice in a list is not distinct, __proto__ too: ajv let __proto__ twice pass', () => {
  const body = { yarns: ['__proto__', '__proto__'] }
  assert.equal(reference.checkEntry(K, 'knitter', 'listing', body), null)
  assert.equal(both(K, 'knitter', 'listing', body), 'yarns takes a list of short words, each different')
})

test('a time has hours to 23 and minutes to 59, also when its zone puts it at 23:59 UTC: ajv let those pass', () => {
  for (const time of ['2026-11-02T24:59:30+01:00', '2026-11-02T23:60:30+00:01']) {
    assert.equal(reference.checkEntry(K, 'client', 'listing', { due: time }), null)
    assert.match(both(K, 'client', 'listing', { due: time })!, /^due takes a time in RFC 3339/)
    assert.match(both(K, 'client', 'listing', { due: { from: '2026-11-02T18:00:00Z', to: time } })!, /^due takes a time in RFC 3339/)
  }
})

test('the browser entry holds the same directory and market files, and needs each one the directory lists', () => {
  assert.deepEqual(browser.directory, markets.directory)
  assert.deepEqual(browser.market(K), markets.market(K))
  assert.equal(browser.market('weaving'), undefined)
  assert.throws(() => loadGiven({ ...files, markets: [] }), { message: 'the directory lists knitting, but no markets/knitting.json was given' })
  assert.equal(loadGiven({ ...files, markets: [knitting, { ...knitting, name: 'weaving' }] }).market('weaving'), undefined)
})

test('a keyword the checker does not know, in build/types.json, throws when the markets load', () => {
  const types = files.types as { $defs: { [type: string]: object } }
  const using = (text: object) => () => loadGiven({ ...files, types: { ...types, $defs: { ...types.$defs, text } } })
  assert.throws(using({ type: 'string', multipleOf: 2 }), { message: 'build/types.json: #/$defs/text has multipleOf: 2, which the checker does not know' })
  assert.throws(using({ type: 'string', format: 'email' }), /format: "email"/)
  assert.throws(using({ type: ['string', 'null'] }), /type: \["string","null"\]/)
  assert.throws(using({ type: 'object', additionalProperties: { type: 'string' } }), /additionalProperties/)
  assert.throws(using({ $ref: '#/$defs/colour' }), { message: 'build/types.json has no #/$defs/colour' })
})

// Last: it asks again every case the tests above asked.
test('the browser entry answers every case with code from strings disallowed, as a strict content security policy does', () => {
  const run = spawnSync(process.execPath, ['--disallow-code-generation-from-strings', fileURLToPath(new URL('browser.ts', import.meta.url))], {
    input: JSON.stringify({ files, cases }),
    encoding: 'utf8',
  })
  assert.equal(run.status, 0, run.stderr)
  assert.ok(cases.length > 200)
  assert.deepEqual(JSON.parse(run.stdout), cases.map((args) => markets.checkEntry(...args)))
})
