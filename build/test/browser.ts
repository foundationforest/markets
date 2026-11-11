// The browser entry as a page uses it: given the files as data, it reads none. markets.test.ts runs
// this with --disallow-code-generation-from-strings, which makes eval and new Function throw, as a
// content security policy without unsafe-eval does, and gives it on stdin { files, cases }: the files
// and a JSON list of checkEntry's arguments. It answers with a JSON list on stdout.

import { readFileSync } from 'node:fs'
import { loadMarkets, type Files, type Markets } from '../src/browser.ts'

let made = true
try {
  new Function('')
} catch {
  made = false
}
if (made) throw new Error('code was made from a string: run this with --disallow-code-generation-from-strings')
const { files, cases } = JSON.parse(readFileSync(0, 'utf8')) as { files: Files; cases: Parameters<Markets['checkEntry']>[] }
const browser = loadMarkets(files)
process.stdout.write(JSON.stringify(cases.map((args) => browser.checkEntry(...args))))
