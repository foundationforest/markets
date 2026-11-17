// What every market file in markets/ holds beyond what the schema and build/check.sh check, read
// through the package from this checkout. These tests name no market, so they hold whatever markets/
// holds, and adding a market never means editing them; markets.test.ts tests the package on a test
// market of its own.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadMarkets } from '../src/index.ts'

const markets = loadMarkets()

test('online is never a place: where a choice offers online, each place applies only when that choice holds something else', () => {
  for (const { name } of markets.directory.markets) {
    const { listing } = markets.market(name)!
    const online = Object.entries(listing).filter(([, field]) => field.piece === 'choice' && Array.isArray(field.values) && field.values.includes('online'))
    for (const [key, field] of Object.entries(listing)) {
      if (field.piece !== 'place') continue
      for (const [choice] of online) {
        const values = field.when?.[choice]
        assert.ok(values !== undefined && values.length > 0 && !values.includes('online'), `${name} ${key} applies when ${choice} holds online`)
      }
    }
  }
})
