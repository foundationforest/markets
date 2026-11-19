// The Node entry: the markets read from a checkout of foundationforest/markets, the directory, the
// shared lists and each market file, with the four answers (markets.ts says each). Everything is read
// once, when the checkout loads, and nothing over the network.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromFiles, type Directory, type Lists, type Market, type Markets } from './markets.ts'

export {
  PIECES, SHARED, UNITS, WAYS, WEEKDAYS, labelOf, nameWords, previewOf, valuesOf, wordsOf,
  type Ask, type Asked, type DateValue, type Directory, type Field, type Fields, type Kind, type Lists, type Market, type Markets,
  type NumberValue, type Options, type Piece, type PlaceValue, type PriceValue, type Role, type Start, type Status, type Unit, type Way, type Weekday, type Words,
} from './markets.ts'

/** The checkout this package sits in: src/ and dist/ are in build/, which is in the checkout. */
const HERE = fileURLToPath(new URL('../../', import.meta.url))

/** The markets in the checkout at `dir`, by default the one this package sits in. */
export function loadMarkets(dir: string = HERE): Markets {
  const read = (path: string): unknown => JSON.parse(readFileSync(join(dir, path), 'utf8'))
  const directory = read('directory.json') as Directory
  const lists = read('build/lists.json') as Lists
  const markets = directory.markets.map(({ name }) => read(`markets/${name}.json`) as Market)
  return fromFiles({ directory, lists, markets })
}
