// The package against this checkout: the directory, each market file, and checkEntry for each kind,
// with the answers it gives in words. Each case runs on both entries and on ajv, the check the
// package made before its own checker, as the reference: all three must agree, but on the answers
// ajv got wrong, each with its own test.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js'
import formats from 'ajv-formats'
import { loadMarkets as loadGiven, previewOf as previewGiven } from '../src/browser.ts'
import { SHARED, loadMarkets, previewOf, type Markets } from '../src/index.ts'
import { fromFiles } from '../src/markets.ts'
import { browser, files } from './browser.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'))
const markets = loadMarkets()

/** The markets with each value checked by ajv, as src/index.ts compiled it before the checker. */
const reference = (() => {
  const types = files.types as { $id: string }
  const ajv = new Ajv2020({ strict: true })
  formats.default(ajv)
  ajv.addSchema(types)
  const compiled = new Map<string, ValidateFunction>()
  return fromFiles(files, (field, value) => {
    const key = JSON.stringify([field.type, field.values, field.per, field.many])
    let validate = compiled.get(key)
    if (!validate) {
      const allows = field.type === 'money' ? { type: 'object', properties: { per: field.per ? { enum: field.per } : false } } : {}
      const one = field.type === 'choice' ? { type: 'string', enum: field.values } : { $ref: `${types.$id}#/$defs/${field.type}`, ...allows }
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

const subject = '9bpPbLYCPwNWq9BZqnJr3EqRNqymFZ4g58Zk9K86azDC'
const photo = { sha256: '04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86', type: 'image/jpeg', size: 48213 }
const place = { lat: '40.42', lon: '-3.70', radiusKm: 5, area: 'Madrid' }
const price = { amount: '30', currency: 'USD', per: 'hour' }

test('the directory and each market file, from this checkout or one named', () => {
  assert.deepEqual(markets.directory, json('directory.json'))
  for (const { name } of markets.directory.markets) assert.deepEqual(markets.market(name), json(`markets/${name}.json`))
  assert.equal(markets.market('knitting'), undefined)
  assert.deepEqual(loadMarkets(ROOT).directory, markets.directory)
})

test("a post fits when each field is its market's, of its type", () => {
  assert.equal(check('tutoring', 'tutor', 'post', { description: 'Maths', price, subjects: ['maths', 'physics'], levels: ['secondary'], mode: ['in-person'], place }), null)
  assert.equal(check('tennis-matches', 'player', 'post', { description: 'Singles', time: '2026-11-02T18:00:00+01:00', format: ['singles'], place }), null)
  assert.equal(check('software-development', 'developer', 'post', { stack: ['python', 'react'] }), null)
  assert.equal(check('home-repair', 'repairer', 'post', { hours: { zone: 'Europe/Madrid', slots: [{ days: ['monday'], from: '09:00', to: '17:00' }] } }), null)
})

test('a post may leave out any field', () => {
  assert.equal(check('tutoring', 'tutor', 'post', {}), null)
  assert.equal(check('tutoring', 'tutor', 'post', { subjects: ['maths'] }), null)
})

test('every post may hold contact, which no market lists', () => {
  for (const { name, roles } of markets.directory.markets) {
    assert.equal(Object.hasOwn(markets.market(name)!.post, 'contact'), false)
    assert.equal(check(name, roles[0]!.role, 'post', { contact: '+34 600 000 000' }), null)
  }
  assert.equal(check('tutoring', 'tutor', 'post', { contact: ['+34 600 000 000'] }), 'contact takes text')
  assert.equal(check('tutoring', 'tutor', 'review', { subject, contact: 'x' }), 'a review in tutoring has no field contact')
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
  assert.equal(check('tutoring', 'tutor', 'post', { price: { amount: 30, currency: 'USD' } }), 'price takes { amount, currency, per }: amount as decimal text, currency a code such as USD, per one of hour, session if wanted')
  assert.match(check('tutoring', 'tutor', 'post', { subjects: ['knitting'] })!, /^subjects takes a list, each different, each one of maths, physics, /)
  assert.match(check('tutoring', 'tutor', 'post', { subjects: ['maths', 'maths'] })!, /^subjects takes a list, each different/)
  assert.match(check('tutoring', 'tutor', 'post', { subjects: 'maths' })!, /^subjects takes a list/)
  assert.match(check('clothing', 'seller', 'post', { kind: 'hat' })!, /^kind takes one of top, shirt, /)
  assert.equal(check('sports-coaching', 'coach', 'post', { minutes: 60 }), 'minutes takes a number as decimal text, such as "2.5"')
  assert.equal(check('software-development', 'developer', 'post', { stack: ['python', 'python'] }), 'stack takes a list of short words, each different')
  assert.match(check('tennis-matches', 'player', 'post', { time: '2026-11-02 18:00' })!, /^time takes a time in RFC 3339/)
})

test('money takes a per its field lists, or none for the whole deal; with no list, never one', () => {
  for (const per of ['hour', 'session']) assert.equal(check('tutoring', 'tutor', 'post', { price: { ...price, per } }), null)
  assert.equal(check('tutoring', 'tutor', 'post', { price: { amount: '300', currency: 'USD' } }), null)
  assert.equal(check('tutoring', 'tutor', 'post', { price: { ...price, per: 'night' } }), 'price takes { amount, currency, per }: amount as decimal text, currency a code such as USD, per one of hour, session if wanted')
  assert.equal(check('clothing', 'seller', 'post', { price: { amount: '40', currency: 'EUR' } }), null)
  assert.equal(check('clothing', 'seller', 'post', { price: { amount: '40', currency: 'EUR', per: 'hour' } }), 'price takes { amount, currency }: amount as decimal text, currency a code such as USD, and no per')
})

test('a place is a point and a radius, with an area name if wanted', () => {
  const { area, ...point } = place
  for (const at of [place, point, { ...place, radiusKm: 0 }]) {
    assert.equal(check('clothing', 'seller', 'post', { location: at }), null)
    assert.equal(check('tennis-matches', 'player', 'post', { place: at }), null)
  }
  const takes = 'place takes { lat, lon, radiusKm, area }: lat and lon as decimal text, radiusKm in whole kilometres, and area a name if wanted'
  const before = [{ area }, { area, reachKm: 10 }, { area, lat: '40.42', lon: '-3.70' }, { area, lat: '40.42', lon: '-3.70', reachKm: 10 }]
  for (const at of [...before, { ...place, radiusKm: 1.5 }, { ...place, radiusKm: -1 }, { ...place, online: true }, { lat: '40.42', radiusKm: 5 }]) {
    assert.equal(check('tennis-matches', 'player', 'post', { place: at }), takes)
  }
})

test('every place field sets the radius an app starts at', () => {
  const starts: { [market: string]: number } = {}
  for (const { name } of markets.directory.markets) {
    for (const [key, field] of Object.entries(markets.market(name)!.post)) if (field.type === 'place') starts[`${name} ${key}`] = field.radiusKm!
  }
  assert.deepEqual(starts, {
    'clothing location': 2, 'electronics location': 2, 'home-cleaning base': 10, 'home-cleaning home': 1, 'home-repair base': 10,
    'home-repair home': 1, 'sports-coaching place': 5, 'tennis-matches place': 5, 'tutoring place': 5,
  })
})

test("previewOf gives a market's preview, or else description, price, then its place fields, of those it has", () => {
  for (const { name } of markets.directory.markets) assert.deepEqual(previewOf(markets.market(name)!), markets.market(name)!.preview)
  const { preview: _repair, ...homeRepair } = markets.market('home-repair')!
  assert.deepEqual(previewOf(homeRepair), ['description', 'price', 'base', 'home'])
  const { preview: _tennis, ...tennis } = markets.market('tennis-matches')!
  assert.deepEqual(previewOf(tennis), ['description', 'place'])
  assert.equal(previewGiven, previewOf)
})

test('home-cleaning and home-repair split place by role: the area the pro works in, and where the home is', () => {
  for (const market of ['home-cleaning', 'home-repair']) {
    const pro = markets.market(market)!.roles[0]!.role
    assert.equal(check(market, pro, 'post', { base: { ...place, radiusKm: 15 } }), null)
    assert.equal(check(market, 'client', 'post', { home: { ...place, radiusKm: 1 } }), null)
    assert.equal(check(market, 'client', 'post', { base: place }), `base is for posts by ${pro}`)
    assert.equal(check(market, pro, 'post', { home: place }), 'home is for posts by client')
  }
})

test('a field with when is held only where the fields it names hold one of its values', () => {
  const shoes = 'footLength is only for a post whose kind is trainers, boots, sandals, heels, flats or slippers'
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['women'], kind: 'boots', footLength: '24.5' }), null)
  assert.equal(check('clothing', 'seller', 'post', { kind: 'coat', footLength: '24.5' }), shoes)
  assert.equal(check('clothing', 'seller', 'post', { footLength: '24.5' }), shoes)
  assert.equal(check('clothing', 'seller', 'post', { footLength: '24.5', kind: 'boots' }), null)
})

test('with several fields named, all must match; a many field matches when any of its values does', () => {
  const adult = { kind: 'coat', size: 'm' }
  assert.equal(check('clothing', 'seller', 'post', { ...adult, wearer: ['women', 'men'] }), null)
  assert.equal(check('clothing', 'seller', 'post', { ...adult, wearer: ['men', 'girls'] }), null)
  assert.match(check('clothing', 'seller', 'post', { ...adult, wearer: ['girls'] })!, /^size is only for a post whose wearer is women or men, and whose kind is top, shirt, .* or underwear$/)
  assert.match(check('clothing', 'seller', 'post', { wearer: ['women'], kind: 'boots', size: 'm' })!, /^size is only for a post whose wearer is women or men, and whose kind is/)
  assert.equal(check('clothing', 'seller', 'post', { wearer: 'women', kind: 'coat', size: 'm' }), 'wearer takes a list, each different, each one of women, men, girls, boys, baby')
})

test('each size is a picker in the system most labels print: letters, waist in inches, age, and shoes in centimetres', () => {
  const waistOnly = 'waist is only for a post whose wearer is women or men, and whose kind is trousers or jeans'
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['women'], kind: 'leggings', size: 'm' }), null)
  assert.equal(check('clothing', 'buyer', 'post', { wearer: ['men'], kind: 'joggers', size: 'xl' }), null)
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['women'], kind: 'leggings', waist: 'w28' }), waistOnly)
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['men'], kind: 'jeans', waist: 'w32' }), null)
  assert.equal(check('clothing', 'buyer', 'post', { wearer: ['women'], kind: 'trousers', waist: 'w27' }), null)
  for (const waist of ['32', 32, 'W32', 'w37']) {
    assert.match(check('clothing', 'seller', 'post', { wearer: ['men'], kind: 'jeans', waist })!, /^waist takes one of w22, w23, .*, w36, w38, .*, w50$/)
  }
  assert.match(check('clothing', 'seller', 'post', { wearer: ['men'], kind: 'jeans', size: 'm' })!, /^size is only for a post whose wearer is women or men, and whose kind is top, .* or underwear$/)
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['boys'], kind: 'jeans', waist: 'w24' }), waistOnly)
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['men'], kind: 'coat', waist: 'w32' }), waistOnly)
  assert.equal(check('clothing', 'buyer', 'post', { wearer: ['baby'], kind: 'nightwear', babySize: '3-6m' }), null)
  assert.equal(check('clothing', 'buyer', 'post', { wearer: ['girls', 'boys'], kind: 'jeans', kidsSize: '7-8y' }), null)
  assert.equal(check('clothing', 'seller', 'post', { wearer: ['girls'], kind: 'leggings', kidsSize: '4-5y' }), null)
  assert.match(check('clothing', 'buyer', 'post', { wearer: ['baby'], kind: 'coat', kidsSize: '2-3y' })!, /^kidsSize is only for a post whose wearer is girls or boys, and whose kind is top, /)
  assert.match(check('clothing', 'buyer', 'post', { wearer: ['women'], kind: 'coat', babySize: '0-3m' })!, /^babySize is only for a post whose wearer is baby, and whose kind is top, /)
  assert.match(check('clothing', 'buyer', 'post', { wearer: ['baby'], kind: 'slippers', babySize: '6-9m' })!, /^babySize is only for a post whose wearer is baby, and whose kind is/)
  assert.match(check('clothing', 'buyer', 'post', { wearer: ['girls'], kind: 'coat', kidsSize: '104' })!, /^kidsSize takes one of 2-3y, /)
  for (const footLength of ['7', '17', '24.5', '29', '33']) {
    assert.equal(check('clothing', 'seller', 'post', { wearer: ['men'], kind: 'trainers', footLength }), null)
  }
  for (const footLength of ['24.3', '25.0', '38', '6.5', '33.5', 24.5]) {
    assert.match(check('clothing', 'seller', 'post', { kind: 'boots', footLength })!, /^footLength takes one of 7, 7\.5, 8, .*, 33$/)
  }
  for (const old of ['shoeSize', 'height']) {
    assert.equal(check('clothing', 'seller', 'post', { [old]: '38' }), `a post in clothing has no field ${old}`)
  }
})

test('a place asked only in person: online alone holds no place', () => {
  for (const market of ['tutoring', 'sports-coaching']) {
    for (const role of markets.market(market)!.roles.map((r) => r.role)) {
      assert.equal(check(market, role, 'post', { mode: ['in-person'], place }), null)
      assert.equal(check(market, role, 'post', { mode: ['online', 'in-person'], place }), null)
      assert.equal(check(market, role, 'post', { mode: ['online'] }), null)
      assert.equal(check(market, role, 'post', { mode: ['online'], place }), 'place is only for a post whose mode is in-person')
      assert.equal(check(market, role, 'post', { place }), 'place is only for a post whose mode is in-person')
    }
  }
})

test('a field with roles and when holds only where both match, in a post and in a review', () => {
  const market = {
    name: 'knitting',
    description: 'Knitters knit to order.',
    roles: [{ role: 'knitter', posts: 'offers' as const }, { role: 'client', posts: 'requests' as const }],
    post: {
      kind: { type: 'choice' as const, description: 'What is knitted.', values: ['jumper', 'scarf'] },
      size: { type: 'choice' as const, description: 'The size.', values: ['s', 'm'], roles: ['client'], when: { kind: ['jumper'] } },
    },
    review: {
      late: { type: 'choice' as const, description: 'Whether it came late.', values: ['yes', 'no'] },
      days: { type: 'number' as const, description: 'How many days late.', roles: ['knitter'], when: { late: ['yes'] } },
    },
  }
  const knitting = loadGiven({ ...files, directory: { markets: [...files.directory.markets, market] }, markets: [...files.markets, market] })
  assert.equal(knitting.checkEntry('knitting', 'client', 'post', { kind: 'jumper', size: 'm' }), null)
  assert.equal(knitting.checkEntry('knitting', 'client', 'post', { kind: 'scarf', size: 'm' }), 'size is only for a post whose kind is jumper')
  assert.equal(knitting.checkEntry('knitting', 'knitter', 'post', { kind: 'jumper', size: 'm' }), 'size is for posts by client')
  assert.equal(knitting.checkEntry('knitting', 'client', 'review', { subject, late: 'yes', days: '2' }, 'knitter'), null)
  assert.equal(knitting.checkEntry('knitting', 'client', 'review', { subject, late: 'no', days: '2' }, 'knitter'), 'days is only for a review whose late is yes')
  assert.equal(knitting.checkEntry('knitting', 'knitter', 'review', { subject, late: 'yes', days: '2' }, 'client'), 'days is for reviews of knitter')
})

test('choices hold no other, either or both: leaving a field out says other, and many says both', () => {
  for (const { name } of markets.directory.markets) {
    const { post, review = {} } = markets.market(name)!
    for (const [key, field] of Object.entries({ ...post, ...review })) {
      for (const value of ['other', 'either', 'both', 'unisex']) assert.ok(!field.values?.includes(value), `${name} ${key} holds ${value}`)
    }
  }
})

/** What build/check.sh's check prints for a checkout of this one's types and schema and one market file. */
const checkFile = (market: { name: string }) => {
  const dir = mkdtempSync(join(tmpdir(), 'markets-'))
  try {
    for (const path of ['build', 'markets']) mkdirSync(join(dir, path))
    for (const path of ['build/types.json', 'build/market.schema.json']) copyFileSync(join(ROOT, path), join(dir, path))
    writeFileSync(join(dir, `markets/${market.name}.json`), JSON.stringify(market))
    const script = fileURLToPath(new URL('../scripts/check.ts', import.meta.url))
    return spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script, dir], { encoding: 'utf8' })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('the check refuses labels on a field that is not a choice', () => {
  const clothing = json('markets/clothing.json')
  clothing.post.brand.labels = { gap: 'GAP' }
  const run = checkFile(clothing)
  assert.equal(run.stderr, 'markets/clothing.json:\n  - /post/brand: "labels" is only for a choice field\n')
  assert.equal(run.status, 1)
})

test("the check refuses a label for a value its field does not list", () => {
  const clothing = json('markets/clothing.json')
  clothing.post.size.labels = { ...clothing.post.size.labels, '5xl': '5XL' }
  const run = checkFile(clothing)
  assert.equal(run.stderr, `markets/clothing.json:\n  - /post/size/labels: "5xl" is not one of size's values\n`)
  assert.equal(run.status, 1)
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

test("the shared fields are of types.json's types, and the schema keeps a post's and a review's names for them", () => {
  const types = Object.keys(json('build/types.json').$defs)
  for (const fields of Object.values(SHARED)) for (const field of Object.values(fields)) assert.ok(types.includes(field.type))
  for (const kind of ['post', 'review'] as const) {
    assert.deepEqual(json('build/market.schema.json').properties[kind].propertyNames.not.enum, Object.keys(SHARED[kind]))
  }
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
    { amount: '0', currency: 'EUR' }, { amount: '12.50', currency: 'USD', per: 'hour' }, { amount: '12.50', currency: 'USD', per: 'session' },
    { amount: '12.50', currency: 'USD', per: 'night' }, { amount: '01', currency: 'USD' },
    { amount: '-1', currency: 'USD' }, { amount: '1.', currency: 'USD' }, { amount: '1', currency: 'usd' }, { amount: '1', currency: 'USDT' },
    { amount: '1', currency: 'USD', per: '' }, { amount: '1', currency: 'USD', per: 7 }, { currency: 'USD' }, { amount: '1' },
    { amount: '1', currency: 'USD', each: 'x' }, '30 USD',
  ]
  const edges: [market: string, role: string, field: string, values: unknown[]][] = [
    ['tutoring', 'tutor', 'contact', ['', 'x', 7, null, ['x'], {}]],
    ['sports-coaching', 'coach', 'minutes', ['0', '-0', '01', '2.', '-2.5', '1e3', ' 1', '١٢', 2]],
    ['software-development', 'developer', 'stack', [
      [], ['a'], [''], ['__proto__'], ['a'.repeat(64)], ['a'.repeat(65)], ['😀'.repeat(64)], ['😀'.repeat(65)], ['a\nb'],
      ['toString', 'toString'], ['constructor', 'constructor'], ['a', 'b', 'a'], [1, 1], [['a'], ['a']], 'a',
    ]],
    ['tutoring', 'tutor', 'subjects', [['maths', 'maths'], ['maths', 'physics'], [], 'maths', ['Maths'], [null]]],
    ['clothing', 'seller', 'kind', ['top', 'TOP', ['top'], 1]],
    ['tennis-matches', 'player', 'place', places],
    ['clothing', 'seller', 'location', places],
    ['home-repair', 'repairer', 'base', places],
    ['home-cleaning', 'client', 'home', places],
    ['tutoring', 'tutor', 'price', prices],
    ['home-repair', 'repairer', 'price', prices],
    ['clothing', 'seller', 'price', prices],
    ['tennis-matches', 'player', 'time', [
      '2024-02-29T00:00:00Z', '2026-02-29T00:00:00Z', '2000-02-29T12:00:00Z', '1900-02-29T12:00:00Z', '2026-04-31T00:00:00Z',
      '2026-04-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-00-10T00:00:00Z', '2026-01-00T00:00:00Z', '0000-01-01T00:00:00Z',
      '2026-12-31T23:59:60Z', '2026-12-31T23:59:60.5Z', '2026-12-31T23:59:61Z', '2027-01-01T00:59:60+01:00', '2026-12-31T22:59:60-01:00',
      '2027-01-01T00:00:60+00:01', '2026-12-31T23:30:60-00:29', at('12:00:60Z'), at('23:59:60+00:00'), at('23:59:60-00:01'),
      at('00:00:00Z'), at('23:59:59Z'), at('23:00:00+23:59'), at('23:00:00+24:00'), at('23:00:00-00:60'), at('18:00:00.123+01:00'),
      at('18:00:00.+01:00'), '2026-11-02t18:00:00z', '2026-11-02 18:00:00Z', at('18:00:00'), at('18:00Z'), at('18:00:00+0100'),
      { from: at('18:00:00Z'), to: at('20:00:00Z') }, { from: at('18:00:00Z') }, { from: at('18:00:00Z'), to: at('20:00:00Z'), at: 'x' },
      { from: at('18:00:00Z'), to: at('24:00:00Z') }, 1762106400,
    ]],
    ['tutoring', 'tutor', 'hours', [
      hours({}), hours({}, 'UTC'), hours({}, 'Etc/GMT+1'), hours({}, 'America/Argentina/Buenos_Aires'), hours({}, '/Madrid'),
      hours({}, 'Europe//Madrid'), hours({}, ''), hours({ days: ['monday', 'monday'] }), hours({ days: [] }), hours({ days: ['Monday'] }),
      hours({ days: ['monday', 'sunday'] }), hours({ from: '24:00' }), hours({ from: '9:00' }), hours({ to: '23:59' }), hours({ to: '23:60' }),
      hours({ extra: 1 }), { zone: 'Europe/Madrid', slots: [] }, { zone: 'Europe/Madrid', slots: [{ days: ['monday'], from: '09:00' }] },
      { zone: 'Europe/Madrid' }, { slots: [] }, { ...hours({}), extra: 1 },
    ]],
    ['clothing', 'seller', 'photos', [
      [hash], [hash.toUpperCase()], [hash.slice(1)], [`${hash}0`], [hash, hash], [], hash,
      [{ valueOf: 1 }, { valueOf: 1 }], [{ toString: 1 }, { toString: 1 }], [{ constructor: {} }, { constructor: {} }],
    ]],
  ]
  for (const [market, role, field, values] of edges) for (const value of values) check(market, role, 'post', { [field]: value })
})

test('a word twice in a list is not distinct, __proto__ too: ajv let __proto__ twice pass', () => {
  const body = { stack: ['__proto__', '__proto__'] }
  assert.equal(reference.checkEntry('software-development', 'developer', 'post', body), null)
  assert.equal(both('software-development', 'developer', 'post', body), 'stack takes a list of short words, each different')
})

test('a time has hours to 23 and minutes to 59, also when its zone puts it at 23:59 UTC: ajv let those pass', () => {
  for (const time of ['2026-11-02T24:59:30+01:00', '2026-11-02T23:60:30+00:01']) {
    assert.equal(reference.checkEntry('tennis-matches', 'player', 'post', { time }), null)
    assert.match(both('tennis-matches', 'player', 'post', { time })!, /^time takes a time in RFC 3339/)
    assert.match(both('software-development', 'client', 'post', { due: { from: '2026-11-02T18:00:00Z', to: time } })!, /^due takes a time in RFC 3339/)
  }
})

test('the browser entry holds the same directory and market files, and needs each one the directory lists', () => {
  assert.deepEqual(browser.directory, markets.directory)
  for (const { name } of markets.directory.markets) assert.deepEqual(browser.market(name), markets.market(name))
  assert.equal(browser.market('knitting'), undefined)
  assert.throws(() => loadGiven({ ...files, markets: files.markets.slice(1) }), { message: 'the directory lists clothing, but no markets/clothing.json was given' })
  assert.deepEqual(loadGiven({ ...files, markets: [...files.markets, { ...files.markets[0]!, name: 'knitting' }] }).market('knitting'), undefined)
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
    input: JSON.stringify(cases),
    encoding: 'utf8',
  })
  assert.equal(run.status, 0, run.stderr)
  assert.ok(cases.length > 200)
  assert.deepEqual(JSON.parse(run.stdout), cases.map((args) => markets.checkEntry(...args)))
})
