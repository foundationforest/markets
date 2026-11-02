// The browser entry, given this checkout's files as data, as a page gives them. Run as a script, it
// answers the cases on its stdin, a JSON list of checkEntry's arguments, with a JSON list on its
// stdout. markets.test.ts runs it with --disallow-code-generation-from-strings, which makes eval and
// new Function throw, as a content security policy without unsafe-eval does.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadMarkets, type Directory, type Files, type Market, type Markets } from '../src/browser.ts'

const json = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'))
const directory = json('directory.json') as Directory
export const files: Files = {
  directory,
  types: json('build/types.json'),
  markets: directory.markets.map(({ name }) => json(`markets/${name}.json`) as Market),
}
export const browser = loadMarkets(files)

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let made = true
  try {
    new Function('')
  } catch {
    made = false
  }
  if (made) throw new Error('code was made from a string: run this with --disallow-code-generation-from-strings')
  const cases = JSON.parse(readFileSync(0, 'utf8')) as Parameters<Markets['checkEntry']>[]
  process.stdout.write(JSON.stringify(cases.map((args) => browser.checkEntry(...args))))
}
