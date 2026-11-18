// The browser entry: the markets from their files, given as data, for a page that cannot read files
// and whose content security policy forbids eval. It imports only markets.ts, which imports nothing,
// and answers as the Node entry (index.ts) does: both are markets.ts.

import { fromFiles, type Files, type Markets } from './markets.ts'

export {
  PARTS, PIECES, SHARED, UNITS, WAYS, WEEKDAYS, labelOf, nameWords, previewOf, valuesOf, wordsOf,
  type Ask, type Asked, type DateValue, type Directory, type Field, type Fields, type Files, type Kind, type Lists, type Market, type Markets,
  type NumberValue, type Options, type Part, type Piece, type PlaceValue, type PriceValue, type Role, type Start, type Status, type Unit, type Way, type Weekday, type Words,
} from './markets.ts'

/** The markets in `files`: directory.json, build/lists.json, and the market file of each market the directory lists. */
export function loadMarkets(files: Files): Markets {
  return fromFiles(files)
}
