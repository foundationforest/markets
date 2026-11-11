// The Node entry: the markets read from a checkout of foundationforest/markets, the directory, each
// market file, and checkEntry (markets.ts says what it checks). Everything is read once, when the
// checkout loads, and nothing over the network.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromFiles, type Directory, type Market, type Markets } from './markets.ts'

export { SHARED, UNITS, previewOf, type Directory, type Field, type Fields, type Kind, type Market, type Markets, type Role, type Status, type Type, type Unit } from './markets.ts'

/** The checkout this package sits in: src/ and dist/ are in build/, which is in the checkout. */
const HERE = fileURLToPath(new URL('../../', import.meta.url))

/** The markets in the checkout at `dir`, by default the one this package sits in. */
export function loadMarkets(dir: string = HERE): Markets {
  const read = (path: string): unknown => JSON.parse(readFileSync(join(dir, path), 'utf8'))
  const directory = read('directory.json') as Directory
  const types = read('build/types.json')
  const markets = directory.markets.map(({ name }) => read(`markets/${name}.json`) as Market)
  return fromFiles({ directory, types, markets })
}
