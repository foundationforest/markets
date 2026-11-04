// The browser entry: the markets from their files, given as data, for a page that cannot read files
// and whose content security policy forbids eval. It imports only markets.ts, which imports nothing,
// and answers as the Node entry (index.ts) does: both are markets.ts.

import { fromFiles, type Files, type Markets } from './markets.ts'

export { SHARED, previewOf, type Directory, type Field, type Fields, type Files, type Kind, type Market, type Markets, type Role, type Type } from './markets.ts'

/** The markets in `files`: directory.json, build/types.json, and the market file of each market the directory lists. */
export function loadMarkets(files: Files): Markets {
  return fromFiles(files)
}
