// The package against this checkout: the directory, each market file, and checkEntry for each kind,
// with the answers it gives in words.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { SHARED, loadMarkets } from '../src/index.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'))
const markets = loadMarkets()
const check = markets.checkEntry

const subject = '9bpPbLYCPwNWq9BZqnJr3EqRNqymFZ4g58Zk9K86azDC'
const photo = { sha256: '04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86', type: 'image/jpeg', size: 48213 }
const place = { lat: '40.42', lon: '-3.70', precisionKm: 1, area: 'Madrid' }
const price = { amount: '30', currency: 'USD', per: 'hour' }

test('the directory and each market file, from this checkout or one named', () => {
  assert.deepEqual(markets.directory, json('directory.json'))
  for (const { name } of markets.directory.markets) assert.deepEqual(markets.market(name), json(`markets/${name}.json`))
  assert.equal(markets.market('knitting'), undefined)
  assert.deepEqual(loadMarkets(ROOT).directory, markets.directory)
})

test("a post fits when each field is its market's, of its type", () => {
  assert.equal(check('tutoring', 'tutor', 'post', { description: 'Maths', price, subjects: ['maths', 'physics'], levels: ['secondary'], place }), null)
  assert.equal(check('tennis-matches', 'player', 'post', { description: 'Singles', time: '2026-11-02T18:00:00+01:00', format: 'singles', place: { online: true } }), null)
  assert.equal(check('software-development', 'developer', 'post', { stack: ['python', 'react'] }), null)
  assert.equal(check('home-repair', 'repairer', 'post', { hours: { zone: 'Europe/Madrid', slots: [{ days: ['monday'], from: '09:00', to: '17:00' }] } }), null)
})

test('required is not enforced on a post', () => {
  assert.equal(check('tutoring', 'tutor', 'post', {}), null)
  assert.equal(check('tutoring', 'tutor', 'post', { subjects: ['maths'] }), null)
})

test('the market, the roles, the kind and the body are named before any field', () => {
  assert.equal(check('knitting', 'maker', 'post', {}), 'knitting is not a market in the directory')
  assert.equal(check('tutoring', 'seller', 'post', {}), 'seller is not a role in tutoring: its roles are tutor, student')
  assert.equal(check('tutoring', 'tutor', 'offer', {}), 'offer is not a kind of entry: the kinds are post, review, vouch and report')
  assert.equal(check('tutoring', 'tutor', 'review', { subject }, 'seller'), 'seller is not a role in tutoring: its roles are tutor, student')
  assert.equal(check('tutoring', 'tutor', 'post', null), 'a post is an object of its fields')
  assert.equal(check('tutoring', 'tutor', 'post', ['maths']), 'a post is an object of its fields')
})

test('a field its market does not name does not fit, nor one Object gives every object', () => {
  assert.equal(check('tutoring', 'tutor', 'post', { description: 'Maths', colour: 'red' }), 'a post in tutoring has no field colour')
  assert.equal(check('tutoring', 'tutor', 'post', { constructor: 'x' }), 'a post in tutoring has no field constructor')
  assert.equal(check('tutoring', 'tutor', 'post', JSON.parse('{ "__proto__": "x" }')), 'a post in tutoring has no field __proto__')
})

test('each value is of its type: a choice among its values, many a list of distinct values', () => {
  assert.equal(check('tutoring', 'tutor', 'post', { price: { amount: 30, currency: 'USD' } }), 'price takes { amount, currency, per }: amount as decimal text, currency a code such as USD, per if wanted')
  assert.match(check('tutoring', 'tutor', 'post', { subjects: ['knitting'] })!, /^subjects takes a list, each different, each one of maths, physics, /)
  assert.match(check('tutoring', 'tutor', 'post', { subjects: ['maths', 'maths'] })!, /^subjects takes a list, each different/)
  assert.match(check('tutoring', 'tutor', 'post', { subjects: 'maths' })!, /^subjects takes a list/)
  assert.match(check('clothing', 'seller', 'post', { kind: 'hat' })!, /^kind takes one of top, shirt, /)
  assert.equal(check('sports-coaching', 'coach', 'post', { minutes: 60 }), 'minutes takes a number as decimal text, such as "2.5"')
  assert.equal(check('software-development', 'developer', 'post', { stack: ['python', 'python'] }), 'stack takes a list of short words, each different')
  assert.match(check('tennis-matches', 'player', 'post', { time: '2026-11-02 18:00' })!, /^time takes a time in RFC 3339/)
})

test('the first field that does not fit is the one answered', () => {
  assert.equal(check('tutoring', 'tutor', 'post', { colour: 'red', subjects: ['knitting'] }), 'a post in tutoring has no field colour')
})

test("a post field kept for some roles fits only a post by one of them", () => {
  assert.equal(check('electronics', 'buyer', 'post', { photos: [] }), 'photos is for posts by seller')
  assert.equal(check('electronics', 'seller', 'post', { photos: [] }), null)
  assert.equal(check('home-repair', 'repairer', 'post', { time: '2026-11-02T18:00:00+01:00' }), 'time is for posts by client')
})

test("a file field names one of the body's files", () => {
  assert.equal(check('clothing', 'seller', 'post', { description: 'A wool coat, worn twice.', photos: [photo.sha256], files: [photo] }), null)
  assert.equal(check('clothing', 'seller', 'post', { photos: [photo.sha256] }), "photos names a file the body's files do not list")
  assert.match(check('clothing', 'seller', 'post', { photos: [photo], files: [photo] })!, /^photos takes a list, each different, each the SHA-256/)
  assert.equal(check('tutoring', 'tutor', 'post', { description: 'Maths', files: [photo] }), null)
})

test('a review holds the fields every review holds, and its market adds others', () => {
  const post = `${subject}/post/maths`
  assert.equal(check('tutoring', 'student', 'review', { subject, score: '8.5', text: 'Clear and patient.', post }), null)
  assert.equal(check('tutoring', 'student', 'review', { subject }), null)
  for (const score of ['1', '10', '10.0', '9.5']) assert.equal(check('tutoring', 'student', 'review', { subject, score }), null)
  for (const score of ['0', '11', '8.55', '0.5', '-1']) {
    assert.equal(check('tutoring', 'student', 'review', { subject, score }), 'score takes a number from "1" to "10" with at most one decimal, such as "8.5"')
  }
  assert.equal(check('tutoring', 'student', 'review', { subject, score: 8 }), 'score takes a number as decimal text, such as "2.5"')
  for (const wrong of ['maths', `${subject}/offer/maths`, `${subject}/post/`, `${subject}/post/a/b`]) {
    assert.equal(check('tutoring', 'student', 'review', { subject, post: wrong }), "post takes a post's address, <profile address>/post/<id>")
  }
  assert.equal(check('tutoring', 'student', 'review', { subject, evidence: 'x' }), 'a review in tutoring has no field evidence')
  assert.equal(check('tutoring', 'student', 'review', { subject, prepared: 'yes' }), 'a review in tutoring has no field prepared')
  assert.equal(check('tennis-matches', 'player', 'review', { subject, showedUp: 'yes', level: 'advanced' }, 'player'), null)
})

test('subject is the one field enforced: a review, a vouch and a report name it', () => {
  for (const kind of ['review', 'vouch', 'report']) {
    assert.equal(check('tutoring', 'student', kind, { text: 'x' }), `a ${kind} names its subject: the address of the profile it is about`)
  }
  assert.equal(check('tutoring', 'student', 'review', { subject: 7 }), 'subject takes text')
})

test("a review field kept for some roles fits only a review of one of them, when that role is known", () => {
  assert.equal(check('home-repair', 'repairer', 'review', { subject, onTime: 'yes' }, 'client'), 'onTime is for reviews of repairer')
  assert.equal(check('home-repair', 'client', 'review', { subject, onTime: 'yes', fixed: 'no' }, 'repairer'), null)
  assert.equal(check('home-repair', 'repairer', 'review', { subject, onTime: 'yes' }), null)
  assert.match(check('home-repair', 'client', 'review', { subject, onTime: 'late' }, 'repairer')!, /^onTime takes one of yes, no$/)
})

test('a vouch and a report hold subject and text, the same in every market', () => {
  assert.equal(check('tutoring', 'tutor', 'vouch', { subject, text: 'Real and honest.' }), null)
  assert.equal(check('clothing', 'buyer', 'report', { subject }, 'seller'), null)
  assert.equal(check('tutoring', 'tutor', 'vouch', { subject, score: '9' }), 'a vouch in tutoring has no field score')
  assert.equal(check('home-repair', 'client', 'report', { subject, onTime: 'no' }), 'a report in home-repair has no field onTime')
})

test("the shared fields are of types.json's types, and the schema keeps a review's names for them", () => {
  const types = Object.keys(json('build/types.json').$defs)
  for (const fields of Object.values(SHARED)) for (const field of Object.values(fields)) assert.ok(types.includes(field.type))
  assert.deepEqual(json('build/market.schema.json').properties.review.propertyNames.not.enum, Object.keys(SHARED.review))
})
