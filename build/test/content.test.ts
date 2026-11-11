// What every market file in markets/ holds beyond what the schema and build/check.sh check, read
// through the package from this checkout: the manual's rules on a market's values. These tests name
// no market, so they hold whatever markets/ holds, and adding a market never means editing them;
// markets.test.ts tests the package on a test market of its own.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadMarkets } from '../src/index.ts'

const markets = loadMarkets()
const each = () =>
  markets.directory.markets.map(({ name }) => {
    const { listing, review = {} } = markets.market(name)!
    return { name, listing, review }
  })

test('choices hold no other, either or both: a field is left out when no value fits, and many says both', () => {
  for (const { name, listing, review } of each()) {
    for (const [key, field] of Object.entries({ ...listing, ...review })) {
      for (const value of ['other', 'either', 'both', 'unisex']) assert.ok(!field.values?.includes(value), `${name} ${key} holds ${value}`)
    }
  }
})

test('online is never a place: where a choice offers online, each place applies only when that choice holds something else', () => {
  for (const { name, listing } of each()) {
    const online = Object.entries(listing).filter(([, field]) => field.type === 'choice' && field.values?.includes('online'))
    for (const [key, field] of Object.entries(listing)) {
      if (field.type !== 'place') continue
      for (const [choice] of online) {
        const values = field.when?.[choice]
        assert.ok(values !== undefined && values.length > 0 && !values.includes('online'), `${name} ${key} applies when ${choice} holds online`)
      }
    }
  }
})
