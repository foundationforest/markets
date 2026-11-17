// The package on the test market, knitting.json, which holds every piece and every key a field may
// hold: the four answers, checkEntry, match, read and ask, and the rest the package exports. The test
// market is read from a checkout of its own, with this checkout's build/lists.json, so these tests hold
// whatever markets/ holds. Every call runs on both entries, which must answer the same, and the last
// test asks each again with code from strings disallowed.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadMarkets as loadGiven, previewOf as previewGiven, type Files } from '../src/browser.ts'
import { SHARED, loadMarkets, nameWords, previewOf, type Directory, type Field, type Market, type Markets } from '../src/index.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const knitting: Market = JSON.parse(readFileSync(new URL('knitting.json', import.meta.url), 'utf8'))
const lists = json('build/lists.json')

/** The test market's files, and a checkout of them alone, for the Node entry to read. */
const directory: Directory = {
  markets: [{ name: knitting.name, summary: knitting.summary, description: knitting.description, status: knitting.status, icon: knitting.icon, number: knitting.number, roles: knitting.roles }],
}
const files: Files = { directory, lists, markets: [knitting] }
const checkout = mkdtempSync(join(tmpdir(), 'markets-'))
after(() => rmSync(checkout, { recursive: true, force: true }))
for (const path of ['build', 'markets']) mkdirSync(join(checkout, path))
writeFileSync(join(checkout, 'build/lists.json'), JSON.stringify(lists))
writeFileSync(join(checkout, 'directory.json'), JSON.stringify(directory))
writeFileSync(join(checkout, 'markets/knitting.json'), JSON.stringify(knitting))
const markets = loadMarkets(checkout)
const browser = loadGiven(files)

/** Every call the tests make on both entries, for the last test to make again with code from strings disallowed. */
const calls: [keyof Pick<Markets, 'checkEntry' | 'ask' | 'match' | 'read'>, ...unknown[]][] = []
/** A call on the Node entry and the browser entry, which must answer the same. */
const both = <M extends 'checkEntry' | 'ask' | 'match' | 'read'>(method: M, ...args: Parameters<Markets[M]>): ReturnType<Markets[M]> => {
  const call = (m: Markets) => (m[method] as (...a: unknown[]) => ReturnType<Markets[M]>)(...args)
  const answer = call(markets)
  assert.deepEqual(call(browser), answer, `${method} ${JSON.stringify(args)}: the entries answer differently`)
  // JSON turns undefined into null: a call with an argument left out is not made again.
  if (!args.includes(undefined)) calls.push([method, ...args])
  return answer
}
const check = (...args: Parameters<Markets['checkEntry']>) => both('checkEntry', ...args)
const ask = (...args: Parameters<Markets['ask']>) => both('ask', ...args)
const today = { today: '2026-11-17' }
const match = (field: Field, a: unknown, b: unknown) => both('match', field, a, b, today)
const read = (field: Field, value: unknown) => both('read', field, value, today)

const K = 'knitting'
const subject = '9bpPbLYCPwNWq9BZqnJr3EqRNqymFZ4g58Zk9K86azDC'
const photo = { sha256: '04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86', type: 'image/jpeg', size: 48213 }
const madrid = { lat: '40.4168', lon: '-3.7038', radiusKm: 5, name: 'Madrid', country: 'ES' }
const price = { amount: '30', currency: 'EUR', per: 'hour' }
const inPerson = { handover: ['in-person'] }
const kids = { wearer: ['children'] }
const listing = (role: string, body: object) => check(K, role, 'listing', body)

test('the package reads a checkout: this one, by default or named, and the test market', () => {
  const here = loadMarkets()
  assert.deepEqual(here.directory, json('directory.json'))
  assert.deepEqual(here.lists, lists)
  for (const { name } of here.directory.markets) assert.deepEqual(here.market(name), json(`markets/${name}.json`))
  assert.deepEqual(loadMarkets(ROOT).directory, here.directory)
  assert.deepEqual(markets.directory, directory)
  assert.deepEqual(markets.market(K), knitting)
  assert.equal(markets.market('weaving'), undefined)
})

test('the browser entry holds the same files, and needs each market the directory lists and the countries list', () => {
  assert.deepEqual(browser.directory, markets.directory)
  assert.deepEqual(browser.market(K), markets.market(K))
  assert.throws(() => loadGiven({ ...files, markets: [] }), { message: 'the directory lists knitting, but no markets/knitting.json was given' })
  assert.throws(() => loadGiven({ ...files, lists: { languages: lists.languages } }), { message: 'build/lists.json holds no countries list' })
  assert.equal(previewGiven, previewOf)
})

// Question 1: does this entry fit?

test('the market, the role, the kind and the body are named before any field', () => {
  assert.equal(check('weaving', 'weaver', 'listing', {}), 'weaving is not a market in the directory')
  assert.equal(check(K, 'seller', 'listing', {}), 'seller is not a role in knitting: its roles are knitter, client')
  assert.equal(check(K, 'knitter', 'offer', {}), 'offer is not a kind of entry: the kinds are listing, review, vouch and report')
  assert.equal(check(K, 'knitter', 'review', { subject }, 'seller'), 'seller is not a role in knitting: its roles are knitter, client')
  assert.equal(check(K, 'knitter', 'listing', null), 'a listing is an object of its fields')
  assert.equal(check(K, 'knitter', 'listing', ['hat']), 'a listing is an object of its fields')
})

test('a listing may leave out any field, and holds only its market\'s and contact', () => {
  assert.equal(listing('knitter', {}), null)
  assert.equal(listing('knitter', { description: 'Hats', colour: 'red' }), 'a listing in knitting has no field colour')
  assert.equal(listing('knitter', { constructor: 'x' }), 'a listing in knitting has no field constructor')
  assert.equal(listing('knitter', JSON.parse('{ "__proto__": "x" }')), 'a listing in knitting has no field __proto__')
  for (const { role } of knitting.roles) assert.equal(listing(role, { contact: '+34 600 000 000' }), null)
  assert.equal(listing('knitter', { contact: ['+34 600 000 000'] }), 'contact takes text')
  assert.equal(check(K, 'knitter', 'review', { subject, contact: 'x' }), 'a review in knitting has no field contact')
})

test('the first field that does not fit is the one answered', () => {
  assert.equal(listing('knitter', { colour: 'red', wearer: ['dogs'] }), 'a listing in knitting has no field colour')
})

test('text: your own words; several, a list of different ones', () => {
  assert.equal(listing('knitter', { description: 'Warm jumpers, knitted to your chest.', yarns: ['merino', 'alpaca'] }), null)
  assert.equal(listing('knitter', { description: 7 }), 'description takes text')
  for (const yarns of ['merino', [], ['merino', 'merino'], [7]]) assert.equal(listing('knitter', { yarns }), 'yarns takes a list of one or more, each different, each text')
})

test("choice: one value from the field's own list, or from the shared list it names", () => {
  assert.equal(listing('knitter', { kind: ['hat', 'socks'], languages: ['es', 'en'] }), null)
  const kind = 'kind takes a list of one or more, each different, each one of jumper, cardigan, scarf, hat, socks'
  for (const value of ['hat', ['shawl'], ['HAT'], ['hat', 'hat'], []]) assert.equal(listing('knitter', { kind: value }), kind)
  assert.equal(listing('knitter', { languages: ['spanish'] }), 'languages takes a list of one or more, each different, each one of the values in the languages list')
  assert.equal(check(K, 'client', 'review', { subject, again: 'maybe' }), 'again takes one of yes, no')
})

test('number: one number, or from one to another with either end open, whole or decimal', () => {
  for (const days of ['10', '0.5', { from: '9', to: '11' }, { from: '9', to: '9' }, { from: '13' }, { to: '6' }, { from: '-1', to: '1' }]) {
    assert.equal(listing('knitter', { days }), null)
  }
  const takes = 'days takes a number as decimal text, such as "2.5", or { from, to }: two such numbers, from no more than to, either left out for no limit that way'
  for (const days of [10, '1e3', '01', '2.', {}, { from: '11', to: '9' }, { from: 9 }, { from: '9', to: '11', step: '1' }, ['9', '11'], '9-11']) {
    assert.equal(listing('knitter', { days }), takes)
  }
  // Several numbers: two age bands.
  assert.equal(listing('knitter', { ...kids, age: [{ to: '1' }, { from: '2', to: '10' }] }), null)
  assert.match(listing('knitter', { ...kids, age: { from: '2', to: '10' } })!, /^age takes a list of one or more, each different, each a number/)
})

test('price: always several, each with a per its field lists or none, and a count only with a per', () => {
  const socks = [{ amount: '35', currency: 'EUR', per: 'item' }, { amount: '90', currency: 'EUR', per: 'item', count: 3 }, { amount: '300', currency: 'EUR' }]
  assert.equal(listing('knitter', { price: socks }), null)
  assert.equal(listing('client', { price: [{ amount: '100', currency: 'EUR', per: 'item', count: 3 }] }), null)
  const each = 'price takes a list of one or more, each different, each { amount, currency, per, count }: amount as decimal text, currency a code such as USD, per one of item, hour if wanted, and count, only with a per, how many of it the amount buys, a whole number'
  for (const wrong of [price, [], [price, { ...price }], [{ ...price, per: 'night' }], [{ amount: '90', currency: 'EUR', count: 3 }], [{ ...price, count: 0 }], [{ ...price, count: 1.5 }], [{ ...price, amount: '-1' }], [{ ...price, currency: 'eur' }], [{ ...price, amount: 30 }]]) {
    assert.equal(listing('knitter', { price: wrong }), each)
  }
  // A price field with no per list: the whole deal, always.
  assert.equal(listing('knitter', { deposit: [{ amount: '40', currency: 'EUR' }] }), null)
  const noPer = 'deposit takes a list of one or more, each different, each { amount, currency }: amount as decimal text, currency a code such as USD, and no per or count'
  for (const wrong of [{ amount: '40', currency: 'EUR' }, [{ amount: '40', currency: 'EUR', per: 'item' }]]) assert.equal(listing('knitter', { deposit: wrong }), noPer)
})

test('place: a circle with its name and country, or a country alone', () => {
  const { radiusKm: _r, ...noRadius } = madrid
  const { name: _n, ...noName } = madrid
  const { country: _c, ...noCountry } = madrid
  for (const area of [madrid, { ...madrid, radiusKm: 0 }, { ...madrid, name: 'Chamberí, Madrid' }, { country: 'ES' }]) assert.equal(listing('client', { ...inPerson, area }), null)
  const takes = "area takes { lat, lon, radiusKm, name, country }: lat and lon as decimal text, radiusKm in whole kilometres, the place's name, and country a two-letter code from the countries list, such as PT; or { country } alone, for anywhere in it"
  for (const area of [noRadius, noName, noCountry, { country: 'XX' }, { country: 'es' }, { ...madrid, country: 'Spain' }, { ...madrid, radiusKm: 1.5 }, { ...madrid, radiusKm: -1 }, { ...madrid, lat: '90.1' }, { ...madrid, lat: 40.4 }, { ...madrid, name: ' ' }, { ...madrid, area: 'Madrid' }, { lat: '40.4', lon: '-3.7', radiusKm: 5 }, 'Madrid']) {
    assert.equal(listing('client', { ...inPerson, area }), takes)
  }
  assert.equal(listing('knitter', { handover: ['shipped'], shipsTo: [{ country: 'PT' }, { country: 'ES' }] }), null)
})

test('date: days, and hours with their zone if wanted', () => {
  const due = (value: unknown) => listing('client', { due: value })
  const fine = [
    { on: '2026-11-24' }, { from: '2027-06-01', to: '2027-08-31' }, { from: '2027-06-01' }, { to: '2027-01-15' }, { on: '2028-02-29' },
    { every: ['saturday'] }, { every: ['saturday'], from: '2027-05-01', to: '2027-09-30', start: '10:00', zone: 'Europe/Lisbon' },
    { on: '2026-12-06', start: '15:00', end: '18:00', zone: 'Europe/Madrid' }, { every: ['friday'], start: '22:00', end: '02:00', zone: 'Europe/Madrid' },
    { on: '2026-11-24', start: '09:00', zone: 'America/Argentina/Buenos_Aires' }, { on: '2026-11-24', start: '09:00', zone: 'UTC' },
  ]
  for (const value of fine) assert.equal(due(value), null, JSON.stringify(value))
  const takes = 'due takes { on }, { from, to } with either left out, or { every, from, to } with from and to if wanted: days as YYYY-MM-DD, from no later than to, every a list of weekdays, monday to sunday; and, if wanted, start, and end if wanted, as HH:MM, end not the same as start, with zone, a time zone by name such as Europe/Madrid'
  const wrong = [
    {}, { on: '2026-02-29' }, { on: '2026-11-31' }, { on: '2026-11-24T10:00:00Z' }, { on: '24/11/2026' }, { on: '2026-11-24', to: '2026-11-25' },
    { from: '2026-12-02', to: '2026-12-01' }, { every: [] }, { every: ['Saturday'] }, { every: ['saturday', 'saturday'] }, { every: 'saturday' },
    { on: '2026-11-24', start: '10:00' }, { on: '2026-11-24', zone: 'Europe/Madrid' }, { on: '2026-11-24', start: '10:00', end: '10:00', zone: 'Europe/Madrid' },
    { on: '2026-11-24', end: '10:00', zone: 'Europe/Madrid' }, { on: '2026-11-24', start: '24:00', zone: 'Europe/Madrid' }, { on: '2026-11-24', start: '9:00', zone: 'Europe/Madrid' },
    { on: '2026-11-24', start: '10:00', zone: '+01:00' }, { on: '2026-11-24', start: '10:00', zone: 'Europe/Atlantis' }, { on: '2026-11-24', at: '10:00' }, '2026-11-24',
  ]
  for (const value of wrong) assert.equal(due(value), takes, JSON.stringify(value))
  // Weekly hours are several date answers.
  const week = [{ every: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00', zone: 'Europe/Madrid' }, { every: ['saturday'], start: '10:00', end: '14:00', zone: 'Europe/Madrid' }]
  assert.equal(listing('knitter', { ...inPerson, meet: week }), null)
  assert.match(listing('knitter', { ...inPerson, meet: week[0] })!, /^meet takes a list of one or more, each different/)
})

test("photo: one of the entry's files, by its SHA-256; link: a web address", () => {
  assert.equal(listing('knitter', { photos: [photo.sha256], files: [photo] }), null)
  assert.equal(listing('knitter', { photos: [photo.sha256] }), "photos names a file the body's files do not list")
  assert.match(listing('knitter', { photos: [photo], files: [photo] })!, /^photos takes a list of one or more, each different, each the SHA-256/)
  assert.equal(listing('client', { description: 'A hat like this', files: [photo] }), null)
  for (const shop of ['https://example.com', 'http://example.com/shop?page=2#top', 'https://knit.example/']) assert.equal(listing('knitter', { shop }), null)
  for (const shop of ['example.com', 'https://', 'https://exa mple.com', 'ftp://example.com', 'https:// example.com']) {
    assert.equal(listing('knitter', { shop }), 'shop takes a web address, starting with https:// or http://')
  }
})

test('a field kept for some roles fits only a listing by one of them', () => {
  assert.equal(listing('client', { photos: [photo.sha256], files: [photo] }), 'photos is for listings by knitter')
  assert.equal(listing('knitter', { due: { on: '2026-12-01' } }), 'due is for listings by client')
})

test('a field with when is held only where the fields it names hold one of its values; several match when any does', () => {
  assert.equal(listing('client', { kind: ['socks'], footLength: '24.5' }), null)
  assert.equal(listing('client', { kind: ['hat'], footLength: '24.5' }), 'footLength is only for a listing whose kind is socks')
  assert.equal(listing('client', { footLength: '24.5' }), 'footLength is only for a listing whose kind is socks')
  const sized = 'size is only for a listing whose wearer is women or men, and whose kind is jumper or cardigan'
  assert.equal(listing('knitter', { kind: ['jumper'], wearer: ['men', 'children'], size: ['m'] }), null)
  assert.equal(listing('knitter', { kind: ['jumper'], wearer: ['children'], size: ['m'] }), sized)
  assert.equal(listing('knitter', { kind: ['scarf'], wearer: ['women'], size: ['m'] }), sized)
  assert.equal(listing('knitter', { handover: ['shipped'], area: madrid }), 'area is only for a listing whose handover is in-person')
  assert.equal(listing('knitter', { handover: ['shipped', 'in-person'], area: madrid }), null)
})

test('a review holds the fields every review holds, and its market adds others, kept to the role reviewed', () => {
  const address = `${subject}/listing/jumper`
  assert.equal(check(K, 'client', 'review', { subject, score: '8.5', text: 'Warm and well made.', listing: address, onTime: 'no', daysLate: '3' }, 'knitter'), null)
  for (const score of ['1', '10', '10.0', '9.5']) assert.equal(check(K, 'client', 'review', { subject, score }), null)
  for (const score of ['0', '11', '8.55', '-1', { from: '7', to: '8' }]) {
    assert.match(check(K, 'client', 'review', { subject, score })!, /^score takes (one number from "1" to "10"|a number as decimal text)/)
  }
  assert.equal(check(K, 'client', 'review', { subject, listing: `${subject}/offer/jumper` }), "listing takes a listing's address, <profile address>/listing/<id>")
  assert.equal(check(K, 'knitter', 'review', { subject, onTime: 'yes' }, 'client'), 'onTime is for reviews of knitter')
  assert.equal(check(K, 'knitter', 'review', { subject, onTime: 'yes' }), null)
  assert.equal(check(K, 'client', 'review', { subject, onTime: 'yes', daysLate: '2' }, 'knitter'), 'daysLate is only for a review whose onTime is no')
  for (const kind of ['review', 'vouch', 'report']) assert.equal(check(K, 'client', kind, { text: 'x' }), `a ${kind} names its subject: the address of the profile it is about`)
  assert.equal(check(K, 'knitter', 'vouch', { subject, text: 'Real and honest.' }), null)
  assert.equal(check(K, 'client', 'report', { subject, score: '1' }), 'a report in knitting has no field score')
})

// Question 2: do these two answers match?

const date: Field = { piece: 'date' }
const dates: Field = { piece: 'date', several: true }
const Z = 'Europe/Madrid'
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

test('a cleaner free Monday to Friday 9 to 17 and Saturday 10 to 14', () => {
  const cleaner = [{ every: weekdays, start: '09:00', end: '17:00', zone: Z }, { every: ['saturday'], start: '10:00', end: '14:00', zone: Z }]
  const client = (answer: object) => match(dates, cleaner, [answer])
  assert.equal(client({ on: '2026-11-24' }), true, 'Tuesday 24 November')
  assert.equal(client({ on: '2026-11-22' }), false, 'Sunday 22 November')
  assert.equal(client({ on: '2026-11-21', start: '16:00', zone: Z }), false, 'Saturday 21 November at 16:00')
  assert.equal(client({ on: '2026-11-21', start: '11:00', zone: Z }), true, 'Saturday 21 November at 11:00')
  assert.equal(client({ from: '2026-11-24', to: '2026-11-28' }), true, 'between 24 and 28 November')
  assert.equal(client({ every: ['tuesday'], start: '09:00', end: '12:00', zone: Z }), true, 'every Tuesday 9 to 12')
  assert.equal(client({ every: ['sunday'] }), false, 'every Sunday')
})

test('a tutor in Madrid and a student in Monterrey meet where their real hours overlap', () => {
  const student = { every: ['monday'], start: '09:00', end: '12:00', zone: 'America/Monterrey' }
  assert.equal(match(date, { every: ['monday'], start: '16:00', end: '20:00', zone: Z }, student), true)
  assert.equal(match(date, { every: ['monday'], start: '09:00', end: '12:00', zone: Z }, student), false)
})

test('spans of days overlap, an end left out limiting nothing', () => {
  const host = { from: '2027-06-01', to: '2027-08-31' }
  assert.equal(match(date, host, { from: '2027-08-20', to: '2027-09-10' }), true)
  assert.equal(match(date, host, { from: '2027-10-01', to: '2027-10-31' }), false)
  assert.equal(match(date, { from: '2027-06-01' }, { from: '2027-10-01', to: '2027-10-31' }), true)
})

test('a weekly tour meets the days a guest is there', () => {
  const tour = { every: ['saturday'], from: '2027-05-01', to: '2027-09-30', start: '10:00', zone: 'Europe/Lisbon' }
  assert.equal(match(date, tour, { from: '2027-07-03', to: '2027-07-09' }), true)
  assert.equal(match(date, tour, { from: '2027-11-01', to: '2027-11-30' }), false)
})

test('several answers match when any pair does', () => {
  const guide = [{ on: '2027-04-02' }, { on: '2027-04-09' }, { on: '2027-04-16' }]
  assert.equal(match(dates, guide, [{ on: '2027-04-09' }]), true)
  assert.equal(match(dates, guide, [{ on: '2027-04-10' }]), false)
})

test("hours apply to each day of a span, and an end before the start runs past midnight", () => {
  const event = { from: '2026-12-05', to: '2026-12-07', start: '09:00', end: '14:00', zone: Z }
  assert.equal(match(date, event, { on: '2026-12-06', start: '15:00', end: '18:00', zone: Z }), false)
  assert.equal(match(date, event, { on: '2026-12-06', start: '08:00', end: '11:00', zone: Z }), true)
  const friday = { every: ['friday'], start: '22:00', end: '02:00', zone: Z }
  assert.equal(match(date, friday, { on: '2026-11-21', start: '01:00', zone: Z }), true)
  assert.equal(match(date, friday, { every: ['saturday'], start: '01:00', zone: Z }), true)
  assert.equal(match(date, friday, { on: '2026-11-21', start: '03:00', zone: Z }), false)
})

test('a deadline is from-to with the start open', () => {
  const by = { to: '2027-01-15' }
  assert.equal(match(date, by, { from: '2026-12-01' }), true)
  assert.equal(match(date, by, { from: '2026-12-01', to: '2026-12-20' }), true)
  assert.equal(match(date, by, { from: '2027-02-01' }), false)
})

test('days with no hours are whole days, read in the zone of the answer they meet', () => {
  assert.equal(match(date, { every: weekdays }, { every: ['wednesday'], start: '17:00', end: '19:00', zone: Z }), true)
  assert.equal(match(date, { every: weekdays }, { on: '2026-11-18', start: '17:00', end: '19:00', zone: Z }), true)
  // Late on Saturday in Tokyo is still Saturday there: a Sunday with no hours of its own does not meet it.
  assert.equal(match(date, { on: '2026-11-22' }, { on: '2026-11-21', start: '23:00', zone: 'Asia/Tokyo' }), false)
  assert.equal(match(date, { on: '2026-11-21' }, { on: '2026-11-21', start: '23:00', zone: 'Asia/Tokyo' }), true)
})

test("a New York tutor's Mondays at 16:00 read as 16:00 in New York, in January and in July", () => {
  const tutor = { every: ['monday'], start: '16:00', zone: 'America/New_York' }
  assert.equal(match(date, tutor, { on: '2027-01-04', start: '21:00', zone: 'UTC' }), true)
  assert.equal(match(date, tutor, { on: '2027-01-04', start: '20:00', zone: 'UTC' }), false)
  assert.equal(match(date, tutor, { on: '2027-07-05', start: '20:00', zone: 'UTC' }), true)
  assert.equal(match(date, tutor, { on: '2027-07-05', start: '21:00', zone: 'UTC' }), false)
})

test('two weekly answers are compared in the week of a given day', () => {
  // Madrid moves its clocks on 28 March 2027, New York on 14 March: in between, 15:00 in Madrid is 10:00 in New York, not 9:00.
  const madrid15 = { every: ['monday'], start: '15:00', zone: Z }
  const ny9 = { every: ['monday'], start: '09:00', end: '09:30', zone: 'America/New_York' }
  assert.equal(markets.match(date, madrid15, ny9, { today: '2026-11-17' }), true)
  assert.equal(markets.match(date, madrid15, ny9, { today: '2027-03-17' }), false)
  assert.throws(() => markets.match(date, madrid15, ny9, { today: '17/11/2026' }), { message: 'today is "17/11/2026", and takes a day as YYYY-MM-DD' })
})

test('places match when their circles touch, and a country matches the places in it', () => {
  const place: Field = { piece: 'place' }
  const getafe = { lat: '40.3083', lon: '-3.7327', radiusKm: 10, name: 'Getafe', country: 'ES' }
  const toledo = { lat: '39.8628', lon: '-4.0273', radiusKm: 5, name: 'Toledo', country: 'ES' }
  const retiro = { lat: '40.4153', lon: '-3.6845', radiusKm: 0, name: 'Retiro park, Madrid', country: 'ES' }
  const lisbon = { lat: '38.7223', lon: '-9.1393', radiusKm: 10, name: 'Lisbon', country: 'PT' }
  assert.equal(match(place, madrid, getafe), true)
  assert.equal(match(place, madrid, toledo), false)
  assert.equal(match(place, retiro, madrid), true)
  assert.equal(match(place, lisbon, { country: 'PT' }), true)
  assert.equal(match(place, lisbon, { country: 'ES' }), false)
  assert.equal(match(place, { country: 'PT' }, { country: 'PT' }), true)
})

test('numbers match when they overlap, choices when the same, and an answer left out never blocks', () => {
  const age: Field = { piece: 'number', unit: 'years' }
  assert.equal(match(age, { from: '9', to: '11' }, '10'), true)
  assert.equal(match(age, { from: '18' }, { from: '30', to: '40' }), true)
  assert.equal(match(age, { to: '6' }, '7'), false)
  assert.equal(match({ ...age, several: true }, [{ from: '3', to: '5' }, { from: '9', to: '11' }], [{ from: '6', to: '8' }]), false)
  assert.equal(match({ ...age, several: true }, [{ from: '3', to: '5' }, { from: '9', to: '11' }], ['10']), true)
  const kind: Field = { piece: 'choice', values: ['hat', 'socks'] }
  assert.equal(match(kind, 'hat', 'hat'), true)
  assert.equal(match(kind, 'hat', 'socks'), false)
  assert.equal(match({ ...kind, several: true }, ['hat', 'socks'], ['socks']), true)
  for (const field of [age, kind, date]) assert.equal(match(field, undefined, '10'), true)
})

test("prices: the offer's costs no more than the request's, per the same thing in the same currency", () => {
  const field: Field = { piece: 'price', per: ['item'] }
  const offer = [{ amount: '35', currency: 'EUR', per: 'item' }, { amount: '90', currency: 'EUR', per: 'item', count: 3 }]
  assert.equal(match(field, offer, [{ amount: '30', currency: 'EUR', per: 'item' }]), true)
  assert.equal(match(field, offer, [{ amount: '29', currency: 'EUR', per: 'item' }]), false)
  // Prices that cannot be compared never block.
  assert.equal(match(field, offer, [{ amount: '10', currency: 'USD', per: 'item' }]), true)
  assert.equal(match(field, offer, [{ amount: '10', currency: 'EUR' }]), true)
})

test('text, a photo and a link are read, not matched', () => {
  for (const piece of ['text', 'photo', 'link'] as const) assert.equal(match({ piece }, 'a', 'b'), true)
})

// Question 3: how does this answer read, in plain English?

test('a date reads as people say it, the year left out when it is this one', () => {
  assert.equal(read(date, { every: weekdays, start: '09:00', end: '17:00', zone: Z }), 'Monday to Friday, 9:00 to 17:00')
  assert.equal(read(date, { every: ['saturday'], start: '10:00', from: '2026-11-21', zone: Z }), 'Saturdays, 10:00, from 21 November')
  assert.equal(read(date, { from: '2027-06-01', to: '2027-08-31' }), '1 June to 31 August 2027')
  assert.equal(read(date, { on: '2026-11-24' }), 'Tuesday 24 November')
  assert.equal(read(date, { on: '2027-01-04', start: '16:00', zone: Z }), 'Monday 4 January 2027, 16:00')
  assert.equal(read(date, { to: '2027-01-15' }), 'Until 15 January 2027')
  assert.equal(read(date, { from: '2026-12-01' }), 'From 1 December')
  assert.equal(read(date, { from: '2026-12-05', to: '2026-12-07', start: '09:00', end: '14:00', zone: Z }), '5 to 7 December, 9:00 to 14:00')
  assert.equal(read(date, { from: '2026-12-20', to: '2027-01-10' }), '20 December 2026 to 10 January 2027')
  assert.equal(read(date, { every: ['saturday', 'sunday', 'wednesday'] }), 'Wednesdays, Saturdays and Sundays')
  assert.equal(read(date, { every: ['friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'sunday'] }), 'Monday to Friday and Sundays')
  assert.equal(read(date, { every: [...weekdays, 'saturday', 'sunday'] }), 'Every day')
  assert.equal(read(date, { every: ['friday'], start: '22:00', end: '02:00', to: '2027-05-01', zone: Z }), 'Fridays, 22:00 to 2:00, until 1 May 2027')
  assert.equal(read(dates, [{ every: weekdays, start: '09:00', end: '17:00', zone: Z }, { every: ['saturday'], start: '10:00', end: '14:00', zone: Z }]), 'Monday to Friday, 9:00 to 17:00; Saturdays, 10:00 to 14:00')
})

test('the other pieces read in plain words', () => {
  assert.equal(read({ piece: 'number', unit: 'years' }, { from: '9', to: '11' }), '9 to 11 years')
  assert.equal(read({ piece: 'number', unit: 'years' }, { from: '18' }), '18 years or more')
  assert.equal(read({ piece: 'number', unit: 'hours' }, '1'), '1 hour')
  assert.equal(read({ piece: 'number', unit: 'square-metres' }, '1300'), '1,300 square metres')
  assert.equal(read({ piece: 'number' }, { to: '4' }), 'Up to 4')
  assert.equal(read({ piece: 'number', several: true }, [{ from: '3', to: '5' }, { from: '9', to: '11' }]), '3 to 5 and 9 to 11')
  assert.equal(read(knitting.listing.age!, [{ from: '2', to: '10' }, { to: '1' }]), '2 to 10 years and up to 1 year')
  assert.equal(read(knitting.listing.age!, [{ to: '1' }, { from: '1' }]), 'Up to 1 year and 1 year or more')
  const prices = [{ amount: '35', currency: 'EUR', per: 'item' }, { amount: '1300', currency: 'MXN', per: 'lesson', count: 5 }, { amount: '300', currency: 'EUR' }, { amount: '50', currency: 'EUR', per: 'person', count: 2 }]
  assert.equal(read({ piece: 'price', per: ['item', 'lesson', 'person'] }, prices), '35 EUR per item; 1,300 MXN for 5 lessons; 300 EUR; 50 EUR for 2 people')
  const places = [{ ...madrid, name: 'Chamberí, Madrid', radiusKm: 1 }, { ...madrid, name: 'Retiro park, Madrid', radiusKm: 0 }, { country: 'PT' }]
  assert.equal(read({ piece: 'place', several: true }, places), 'Around Chamberí, Madrid, 1 km; Retiro park, Madrid; Anywhere in Portugal')
  assert.equal(read({ piece: 'place' }, { lat: '25.6522', lon: '-100.4036', radiusKm: 10, name: 'Del Valle, San Pedro Garza García', country: 'MX' }), 'Around Del Valle, San Pedro Garza García, 10 km')
  assert.equal(read(knitting.listing.languages!, ['es', 'en', 'pt']), 'Spanish, English and Portuguese')
  assert.equal(read(knitting.listing.size!, ['xl']), 'XL')
  assert.equal(read(knitting.listing.handover!, ['in-person']), 'In person')
  // A value's own words are lower case after the first; a label keeps its case, as it may be a name.
  assert.equal(read({ piece: 'choice', values: ['weekly', 'every-two-weeks'], several: true }, ['weekly', 'every-two-weeks']), 'Weekly and every two weeks')
  assert.equal(read(knitting.listing.handover!, ['shipped', 'in-person']), 'Shipped and in person')
  assert.equal(read(knitting.listing.size!, ['m', 'xl']), 'M and XL')
  assert.equal(read({ piece: 'text', several: true }, ['merino', 'alpaca']), 'merino and alpaca')
  assert.equal(read({ piece: 'photo', several: true }, [photo.sha256]), '1 photo')
  assert.equal(read({ piece: 'link' }, 'https://example.com'), 'https://example.com')
})

// Question 4: what does this market ask this role?

test("a market asks a role its fields in order: the preview first, each after the fields its when names, then contact", () => {
  assert.deepEqual(ask(K, 'knitter').map((f) => f.name), ['kind', 'photos', 'description', 'price', 'wearer', 'size', 'age', 'chest', 'footLength', 'yarns', 'deposit', 'days', 'handover', 'area', 'meet', 'shipsTo', 'languages', 'shop', 'contact'])
  assert.deepEqual(ask(K, 'client').map((f) => f.name), ['kind', 'description', 'price', 'wearer', 'size', 'age', 'chest', 'footLength', 'yarns', 'due', 'handover', 'area', 'meet', 'languages', 'contact'])
  assert.deepEqual(ask(K, 'client', 'review', 'knitter').map((f) => f.name), ['subject', 'listing', 'score', 'text', 'onTime', 'daysLate', 'again'])
  assert.deepEqual(ask(K, 'knitter', 'review', 'client').map((f) => f.name), ['subject', 'listing', 'score', 'text', 'paid', 'again'])
  assert.deepEqual(ask(K, 'knitter', 'vouch').map((f) => f.name), ['subject', 'text'])
  assert.throws(() => markets.ask(K, 'seller'), { message: 'seller is not a role in knitting: its roles are knitter, client' })
})

test("each field comes with its words: the role's, or else the field's, or else its label, or else its name in words", () => {
  const by = (role: string, kind = 'listing', about?: string) => Object.fromEntries(ask(K, role, kind, about).map((f) => [f.name, f]))
  const knitter = by('knitter')
  const client = by('client')
  assert.equal(knitter.area!.question, 'Where can you hand work over?')
  assert.deepEqual(knitter.area!.start, { radiusKm: 10 })
  assert.equal(client.area!.question, 'Where do you live?')
  assert.equal(client.area!.hint, 'Your neighbourhood and town, never your door.')
  assert.deepEqual(client.area!.start, { radiusKm: 1 })
  assert.equal(knitter.shipsTo!.label, 'Ships to')
  assert.deepEqual(knitter.shipsTo!.start, { radiusKm: 5 })
  assert.equal(client.footLength!.label, 'Foot length')
  assert.equal(client.footLength!.question, 'Foot length')
  assert.deepEqual(client.footLength!.start, { range: false })
  assert.deepEqual(knitter.age!.start, { range: true })
  assert.deepEqual(client.age!.start, { range: false })
  assert.equal(client.chest!.hint, 'Round its widest part, in centimetres.')
  assert.deepEqual(client.due!.start, { way: 'until', hours: false })
  assert.deepEqual(client.meet!.start, { way: 'weekly', hours: true })
  assert.equal(client.yarns!.question, 'Yarns')
  assert.equal(knitter.description!.question, 'What do you knit, and how?')
  assert.equal(knitter.description!.ask!.long, true)
  assert.equal(knitter.contact!.question, 'How can people reach you outside Forest?')
  assert.deepEqual(client.size!.choices!.slice(0, 2), [{ value: 'xs', label: 'XS' }, { value: 's', label: 'S' }])
  assert.deepEqual(client.handover!.choices, [{ value: 'in-person', label: 'In person' }, { value: 'shipped', label: 'Shipped' }])
  assert.deepEqual(client.languages!.choices!.find((c) => c.value === 'es'), { value: 'es', label: 'Spanish' })
  assert.equal(client.languages!.choices!.length, Object.keys(lists.languages).length)
  assert.equal(client.kind!.takes, 'a list of one or more, each different, each one of jumper, cardigan, scarf, hat, socks')
  assert.equal(client.kind!.several, true)
  assert.deepEqual(client.size!.when, knitting.listing.size!.when)
  assert.equal(by('client', 'review', 'knitter').again!.label, 'Again')
  assert.equal(by('knitter', 'review', 'client').paid!.question, 'Did they pay as agreed?')
  assert.equal(by('knitter', 'review', 'client').score!.ask!.usual!.to, '10')
})

test("previewOf gives a market's preview, or else description, price, then its place fields, of those it has", () => {
  assert.deepEqual(previewOf(knitting), knitting.preview)
  const { preview: _preview, ...none } = knitting
  assert.deepEqual(previewOf(none), ['description', 'price', 'area', 'shipsTo'])
})

test('the shared fields are pieces, a name in words reads as people write it, and every shared field has a label', () => {
  for (const fields of Object.values(SHARED)) for (const field of Object.values(fields)) assert.ok(field.ask?.label)
  assert.equal(nameWords('footLength'), 'Foot length')
  assert.equal(nameWords('taughtIn'), 'Taught in')
  assert.equal(nameWords('size2'), 'Size 2')
})

// Last: it makes again every call the tests above made.
test('the browser entry answers every call with code from strings disallowed, as a strict content security policy does', () => {
  const run = spawnSync(process.execPath, ['--disallow-code-generation-from-strings', fileURLToPath(new URL('browser.ts', import.meta.url))], {
    input: JSON.stringify({ files, cases: calls }),
    encoding: 'utf8',
  })
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.length > 200)
  const expected = calls.map(([method, ...args]) => (markets[method] as (...a: unknown[]) => unknown)(...args))
  assert.deepEqual(JSON.parse(run.stdout), JSON.parse(JSON.stringify(expected)))
})
