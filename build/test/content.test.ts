// What the market files in markets/ hold, read through the package from this checkout. These tests
// pin those markets' content, so they change with the markets; markets.test.ts tests the package on a
// test market of its own.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadMarkets } from '../src/index.ts'

const markets = loadMarkets()
const { checkEntry: check } = markets
const place = { lat: '40.42', lon: '-3.70', radiusKm: 5, area: 'Madrid' }

test('every place field sets the radius an app starts at', () => {
  const starts: { [market: string]: number } = {}
  for (const { name } of markets.directory.markets) {
    for (const [key, field] of Object.entries(markets.market(name)!.listing)) if (field.type === 'place') starts[`${name} ${key}`] = field.radiusKm!
  }
  assert.deepEqual(starts, {
    'clothing location': 2, 'electronics location': 2, 'home-cleaning base': 10, 'home-cleaning home': 1, 'home-repair base': 10,
    'home-repair home': 1, 'sports-coaching place': 5, 'tennis-matches place': 5, 'tutoring place': 5,
  })
})

test('every number names its unit', () => {
  const units: { [field: string]: string } = {}
  for (const { name } of markets.directory.markets) {
    const { listing, review = {} } = markets.market(name)!
    for (const [key, field] of Object.entries({ ...listing, ...review })) if (field.type === 'number') units[`${name} ${key}`] = field.unit!
  }
  assert.deepEqual(units, { 'sports-coaching groupSize': 'people', 'sports-coaching minutes': 'minutes', 'tutoring minutes': 'minutes' })
})

test('home-cleaning and home-repair split place by role: the area the pro works in, and where the home is', () => {
  for (const market of ['home-cleaning', 'home-repair']) {
    const pro = markets.market(market)!.roles[0]!.role
    assert.equal(check(market, pro, 'listing', { base: { ...place, radiusKm: 15 } }), null)
    assert.equal(check(market, 'client', 'listing', { home: { ...place, radiusKm: 1 } }), null)
    assert.equal(check(market, 'client', 'listing', { base: place }), `base is for listings by ${pro}`)
    assert.equal(check(market, pro, 'listing', { home: place }), 'home is for listings by client')
  }
})

test('each size is a picker in the system most labels print: letters, waist in inches, age, and shoes in centimetres', () => {
  const waistOnly = 'waist is only for a listing whose wearer is women or men, and whose kind is trousers or jeans'
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['women'], kind: 'leggings', size: 'm' }), null)
  assert.equal(check('clothing', 'buyer', 'listing', { wearer: ['men'], kind: 'joggers', size: 'xl' }), null)
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['women'], kind: 'leggings', waist: 'w28' }), waistOnly)
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['men'], kind: 'jeans', waist: 'w32' }), null)
  assert.equal(check('clothing', 'buyer', 'listing', { wearer: ['women'], kind: 'trousers', waist: 'w27' }), null)
  for (const waist of ['32', 32, 'W32', 'w37']) {
    assert.match(check('clothing', 'seller', 'listing', { wearer: ['men'], kind: 'jeans', waist })!, /^waist takes one of w22, w23, .*, w36, w38, .*, w50$/)
  }
  assert.match(check('clothing', 'seller', 'listing', { wearer: ['men'], kind: 'jeans', size: 'm' })!, /^size is only for a listing whose wearer is women or men, and whose kind is top, .* or underwear$/)
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['boys'], kind: 'jeans', waist: 'w24' }), waistOnly)
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['men'], kind: 'coat', waist: 'w32' }), waistOnly)
  assert.equal(check('clothing', 'buyer', 'listing', { wearer: ['baby'], kind: 'nightwear', babySize: '3-6m' }), null)
  assert.equal(check('clothing', 'buyer', 'listing', { wearer: ['girls', 'boys'], kind: 'jeans', kidsSize: '7-8y' }), null)
  assert.equal(check('clothing', 'seller', 'listing', { wearer: ['girls'], kind: 'leggings', kidsSize: '4-5y' }), null)
  assert.match(check('clothing', 'buyer', 'listing', { wearer: ['baby'], kind: 'coat', kidsSize: '2-3y' })!, /^kidsSize is only for a listing whose wearer is girls or boys, and whose kind is top, /)
  assert.match(check('clothing', 'buyer', 'listing', { wearer: ['women'], kind: 'coat', babySize: '0-3m' })!, /^babySize is only for a listing whose wearer is baby, and whose kind is top, /)
  assert.match(check('clothing', 'buyer', 'listing', { wearer: ['baby'], kind: 'slippers', babySize: '6-9m' })!, /^babySize is only for a listing whose wearer is baby, and whose kind is/)
  assert.match(check('clothing', 'buyer', 'listing', { wearer: ['girls'], kind: 'coat', kidsSize: '104' })!, /^kidsSize takes one of 2-3y, /)
  for (const footLength of ['7', '17', '24.5', '29', '33']) {
    assert.equal(check('clothing', 'seller', 'listing', { wearer: ['men'], kind: 'trainers', footLength }), null)
  }
  for (const footLength of ['24.3', '25.0', '38', '6.5', '33.5', 24.5]) {
    assert.match(check('clothing', 'seller', 'listing', { kind: 'boots', footLength })!, /^footLength takes one of 7, 7\.5, 8, .*, 33$/)
  }
  for (const old of ['shoeSize', 'height']) {
    assert.equal(check('clothing', 'seller', 'listing', { [old]: '38' }), `a listing in clothing has no field ${old}`)
  }
})

test('a place asked only in person: online alone holds no place', () => {
  for (const market of ['tutoring', 'sports-coaching']) {
    for (const role of markets.market(market)!.roles.map((r) => r.role)) {
      assert.equal(check(market, role, 'listing', { mode: ['in-person'], place }), null)
      assert.equal(check(market, role, 'listing', { mode: ['online', 'in-person'], place }), null)
      assert.equal(check(market, role, 'listing', { mode: ['online'] }), null)
      assert.equal(check(market, role, 'listing', { mode: ['online'], place }), 'place is only for a listing whose mode is in-person')
      assert.equal(check(market, role, 'listing', { place }), 'place is only for a listing whose mode is in-person')
    }
  }
})

test('choices hold no other, either or both: a field is left out when no value fits, and many says both', () => {
  for (const { name } of markets.directory.markets) {
    const { listing, review = {} } = markets.market(name)!
    for (const [key, field] of Object.entries({ ...listing, ...review })) {
      for (const value of ['other', 'either', 'both', 'unisex']) assert.ok(!field.values?.includes(value), `${name} ${key} holds ${value}`)
    }
  }
})
