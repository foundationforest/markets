// build/check.sh's check, scripts/check.ts, on checkouts made for each case from the test market,
// knitting.json, with this checkout's build/lists.json, build/market.schema.json and build/icons.json
// unless a case gives its own; and, for the rules that a shared list and a market live on main only
// grow, a copy of main made the same way. A checkout made here has no directory yet, so one whose
// markets all pass fails only with both directory files stale.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PIECES, UNITS } from '../src/markets.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const knitting = JSON.parse(readFileSync(new URL('knitting.json', import.meta.url), 'utf8'))
/**
 * Each market's number, by its name: the test market's own for it, and the next for each name after,
 * so a copy on main and the same copy here hold the same number, and no two copies share one.
 */
const numbers = new Map<string, number>([[knitting.name, knitting.number]])
const numberOf = (name: string): number => numbers.get(name) ?? numbers.set(name, Math.max(...numbers.values()) + 1).get(name)!
/** A copy of the test market to change, by another name if given. Only the test market keeps its icon, since no two markets share one. */
const copy = (name = 'knitting'): any => {
  const market = { ...structuredClone(knitting), name, number: numberOf(name) }
  if (name !== knitting.name) delete market.icon
  return market
}

type Checkout = { markets: any[]; lists?: object; schema?: object }

/** What the check prints for `checkout`, compared with `main` when given, and the directory it writes. */
const run = (checkout: Checkout, main?: Checkout) => {
  const dirs: string[] = []
  const make = ({ markets, lists = json('build/lists.json'), schema = json('build/market.schema.json') }: Checkout) => {
    const dir = mkdtempSync(join(tmpdir(), 'markets-'))
    dirs.push(dir)
    for (const path of ['build', 'markets']) mkdirSync(join(dir, path))
    writeFileSync(join(dir, 'build/lists.json'), JSON.stringify(lists))
    writeFileSync(join(dir, 'build/market.schema.json'), JSON.stringify(schema))
    writeFileSync(join(dir, 'build/icons.json'), JSON.stringify(json('build/icons.json')))
    for (const market of markets) writeFileSync(join(dir, `markets/${market.name}.json`), JSON.stringify(market))
    return dir
  }
  try {
    const dir = make(checkout)
    const script = fileURLToPath(new URL('../scripts/check.ts', import.meta.url))
    const args = ['--disable-warning=ExperimentalWarning', script, dir, ...(main ? [make(main)] : [])]
    const { status, stdout, stderr } = spawnSync(process.execPath, args, { encoding: 'utf8' })
    const read = (path: string) => (existsSync(join(dir, path)) ? readFileSync(join(dir, path), 'utf8') : undefined)
    return { status, stdout, stderr, directory: read('directory.json'), md: read('directory.md') }
  } finally {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  }
}
/** What the check says of one market, the test market changed as given. */
const said = (change: (market: any) => void) => {
  const market = copy()
  change(market)
  return run({ markets: [market] }).stderr
}
const of = (...lines: string[]) => ['markets/knitting.json:', ...lines.map((line) => `  - ${line}`), ''].join('\n')

const stale = 'directory.json:\n  - was stale: rewritten from the market files; commit it\ndirectory.md:\n  - was stale: rewritten from the market files; commit it\n'
const closing = 'A market live on main only grows: one that must break becomes a new market, with a new name.\n'

test('the test market passes, and the directory holds what a list of markets shows', () => {
  const plain = { ...copy('weaving'), status: 'beta', summary: 'Weavers weave cloth to order' }
  delete plain.description
  const ran = run({ markets: [copy(), plain] })
  assert.equal(ran.stderr, stale)
  const listed = JSON.parse(ran.directory!).markets
  const { summary, description, roles } = knitting
  assert.deepEqual(listed[0], { name: 'knitting', summary, description, status: 'live', icon: 'yarn', number: 1, roles })
  // With no icon and no description, the directory leaves them out.
  assert.deepEqual(Object.keys(listed[1]), ['name', 'summary', 'status', 'number', 'roles'])
  const lines = ran.md!.split('\n')
  assert.ok(lines.includes(`- [\`knitting\`](markets/knitting.json) (live): ${summary} ${description} Roles: knitter (offers), client (requests).`))
  assert.ok(lines.includes('- [`weaving`](markets/weaving.json) (beta): Weavers weave cloth to order. Roles: knitter (offers), client (requests).'))
})

test('the shortest market file is names and pieces', () => {
  const shortest = { name: 'knitting', summary: 'Knitters knit clothes to order.', status: 'beta', number: 1, roles: [{ role: 'knitter', listings: 'offers' }], listing: { description: { piece: 'text' }, kind: { piece: 'choice', values: ['hat'] } } }
  assert.equal(run({ markets: [shortest] }).stderr, stale)
})

test('a market says its summary, whether it is live or beta, and its number', () => {
  assert.equal(said((m) => delete m.status), of('the file: "status" is missing'))
  assert.equal(said((m) => (m.status = 'alpha')), of('/status must be one of "live", "beta"'))
  assert.equal(said((m) => (m.summary = `Knitters knit ${'a'.repeat(80)}.`)), of('/summary must be at most 80 characters: an app shows it where someone picks a market'))
  assert.equal(said((m) => (m.summary = 'Knitters knit.\nTo order.')), of('/summary must be one line of text, not only spaces'))
  for (const number of [0, 1.5, '3']) assert.equal(said((m) => (m.number = number)), of('/number must be a whole number from 1'))
})

test('each field is one of the eight pieces, and each rule is kept to the pieces it fits', () => {
  assert.equal(said((m) => (m.listing.yarns.piece = 'words')), of(`/listing/yarns/piece must be one of ${PIECES.map((p) => JSON.stringify(p)).join(', ')}`))
  assert.equal(said((m) => delete m.listing.yarns.piece), of('/listing/yarns: "piece" is missing'))
  assert.equal(said((m) => (m.listing.yarns.description = 'The yarns.')), of('/listing/yarns: unknown key "description"'))
  assert.equal(said((m) => delete m.listing.kind.values), of('/listing/kind: "values" is missing'))
  assert.equal(
    said((m) => {
      m.listing.yarns.values = ['merino']
      m.listing.yarns.unit = 'days'
      m.listing.yarns.per = ['item']
      m.listing.price.several = true
      m.listing.chest.unit = 'inches'
      m.listing.shop.several = 'yes'
    }),
    of(
      `/listing/chest/unit must be one of ${UNITS.map((u) => JSON.stringify(u)).join(', ')}`,
      '/listing/yarns: "values" is only for a choice field',
      '/listing/yarns: "unit" is only for a number field',
      '/listing/yarns: "per" is only for a price field',
      '/listing/price must not hold "several": a price is always several',
      '/listing/shop/several must be true, or left out',
    ),
  )
})

test('a price is never per visit, session or lesson, whose length is unknown', () => {
  const container = 'must not be visit, session or lesson: its length is unknown, so a price per one compares with no price per hour; a price for time is per hour, for a length'
  assert.equal(said((m) => m.listing.price.per.push('session')), of(`/listing/price/per/2 ${container}`))
  assert.equal(said((m) => (m.listing.deposit.per = ['visit', 'lesson'])), of(`/listing/deposit/per/0 ${container}`, `/listing/deposit/per/1 ${container}`))
})

test("a choice's values are its own list, or the name of a shared list in build/lists.json", () => {
  assert.equal(said((m) => (m.listing.languages.values = 'tongues')), of('/listing/languages/values: "tongues" is not a list in build/lists.json'))
  assert.equal(said((m) => (m.listing.languages.values = [])), of('/listing/languages/values must be a list of values, or the name of a list in build/lists.json'))
  assert.equal(said((m) => (m.listing.languages.values = 'Languages')), of('/listing/languages/values must be a list of values, or the name of a list in build/lists.json'))
})

test('the shared names keep their meaning, and a market never lists the fields every entry holds', () => {
  assert.equal(said((m) => (m.listing.description = { piece: 'choice', values: ['x'] })), of('/listing/description/piece must be "text": description is a shared name, a listing\'s main text'))
  assert.equal(said((m) => (m.listing.description.several = true)), of('/listing/description must not hold "several": description is a shared name, and a listing holds one'))
  assert.equal(said((m) => (m.listing.price = { piece: 'number' })), of('/listing/price/piece must be "price": price is a shared name, the money a program sorts by'))
  assert.equal(said((m) => (m.listing.contact = { piece: 'text' })), of('/listing: "contact" is a field every listing may hold: build/README.md defines it, and no market lists it'))
  assert.equal(said((m) => (m.review.score = { piece: 'number' })), of('/review: "score" is a field every review holds: build/README.md defines it, and a market adds only others'))
  assert.equal(said((m) => (m.listing.files = { piece: 'photo' })), of('/listing: "files" is not a field name: the standard keeps it for the files an entry names'))
  assert.equal(said((m) => (m.listing['start-time'] = { piece: 'date' })), of('/listing: "start-time" is not a field name: a lowercase letter, then letters and digits, at most 64 characters'))
})

test('roles, when and preview name what the market has, and when never goes in a loop', () => {
  assert.equal(said((m) => (m.listing.photos.roles = ['knitter', 'seller'])), of('/listing/photos/roles: "seller" is not a role here: the roles are knitter, client'))
  assert.equal(said((m) => m.roles.push({ role: 'client', listings: 'offers' })), of('the role "client" is listed twice'))
  assert.equal(said((m) => (m.listing.chest.when = { yarns: ['merino'] })), of('/listing/chest/when: "yarns" is not a choice field in "listing"'))
  assert.equal(said((m) => (m.listing.chest.when = { kind: ['shawl'] })), of('/listing/chest/when/kind: "shawl" is not one of kind\'s values'))
  assert.equal(said((m) => (m.listing.chest.when = { languages: ['es', 'Spanish'] })), of('/listing/chest/when/languages: "Spanish" is not one of languages\'s values'))
  assert.equal(said((m) => (m.listing.colour = { piece: 'choice', values: ['red'], roles: ['knitter'] }) && (m.listing.chest.when = { colour: ['red'], kind: ['jumper'] })), of('/listing/chest: its when names "colour", which is only for knitter, so its roles must be among those'))
  assert.equal(said((m) => (m.listing.kind.when = { size: ['m'] })), of('/listing: when goes in a loop (kind depends on size depends on kind), so a form cannot ask any of them first'))
  assert.equal(said((m) => (m.preview = ['kind', 'colour'])), of('/preview: "colour" is not a field in "listing": the fields are description, kind, wearer, size, age, chest, footLength, yarns, price, deposit, days, due, handover, area, meet, shipsTo, languages, photos, shop'))
})

test('suggestions are checked only to be well formed: each key for the piece it opens, each role and label for one the market has', () => {
  assert.equal(
    said((m) => {
      m.listing.kind.ask.long = true
      m.listing.chest.ask.labels = { '100': 'One hundred' }
      m.listing.yarns.ask.start = { radiusKm: 5 }
      m.listing.area.ask.as.client.start = { way: 'weekly' }
      m.listing.due.ask.start = { range: true, hours: true }
      m.listing.size.ask.labels.xxl = 'XXL'
      m.listing.area.ask.as.seller = { question: 'Where is your shop?' }
    }),
    of(
      '/listing/kind/ask: "long" is only for a text field',
      '/listing/size/ask/labels: "xxl" is not one of size\'s values',
      '/listing/chest/ask: "labels" is only for a choice field',
      '/listing/yarns/ask/start: "radiusKm" is only for a place field',
      '/listing/due/ask/start: "range" is only for a number field',
      '/listing/area/ask/as: "seller" is not a role here: the roles are knitter, client',
      '/listing/area/ask/as/client/start: "way" is only for a date field',
    ),
  )
  assert.equal(said((m) => (m.listing.kind.ask.lable = 'Kind')), of('/listing/kind/ask: unknown key "lable"'))
  assert.equal(said((m) => (m.listing.area.ask.start = {})), of('/listing/area/ask/start must not be empty'))
  assert.equal(said((m) => (m.listing.meet.ask.start.way = 'monthly')), of('/listing/meet/ask/start/way must be one of "day", "from-to", "until", "weekly"'))
  assert.equal(said((m) => (m.listing.meet.ask.start.hours = 'morning')), of('/listing/meet/ask/start/hours must be one of true, "part"'))
  assert.equal(said((m) => (m.listing.price.ask.as.client.label = '')), of('/listing/price/ask/as/client/label must be one line of text, not only spaces'))
  // A label for a value of a shared list is one of its values.
  assert.equal(said((m) => (m.listing.languages.ask.labels = { es: 'Castilian' })), stale)
})

test('an icon is one of the Phosphor icons in build/icons.json, and no two markets share an icon or a number', () => {
  assert.equal(said((m) => (m.icon = 'knitting-needles')), of('/icon: "knitting-needles" is not a Phosphor icon: build/icons.json lists them'))
  const markets = [copy(), { ...copy('weaving'), icon: 'yarn', number: 1 }, copy('sewing')]
  assert.equal(run({ markets }).stderr, [
    'markets/knitting.json:',
    '  - /icon: "yarn" is also the icon of weaving: no two markets share one, so a list of them tells each apart',
    '  - /number: 1 is also the number of weaving: no two markets share one, since apps tell markets apart by it',
    'markets/weaving.json:',
    '  - /icon: "yarn" is also the icon of knitting: no two markets share one, so a list of them tells each apart',
    '  - /number: 1 is also the number of knitting: no two markets share one, since apps tell markets apart by it',
    '',
  ].join('\n'))
})

test('build/lists.json holds lists of values with their words, each country a two-letter code', () => {
  const lists = json('build/lists.json')
  assert.equal(run({ markets: [copy()], lists: { ...lists, countries: { ...lists.countries, es: 'Spain' } } }).stderr, 'build/lists.json:\n  - /countries/es is not a two-letter code, as ISO 3166-1 writes one\n')
  assert.equal(run({ markets: [copy()], lists: { ...lists, Sizes: {} } }).stderr, 'build/lists.json:\n  - "Sizes" is not a list name: lowercase letters, digits and single hyphens\n  - /Sizes must be an object of one or more values, each with its words\n')
})

test("the schema's pieces and units are the package's", () => {
  const schema = json('build/market.schema.json')
  schema.$defs.field.properties.unit.enum = UNITS.filter((unit) => unit !== 'hours')
  const units = UNITS.join(', ')
  assert.equal(run({ markets: [copy()], schema }).stderr, `build/market.schema.json:\n  - its units (${units.replace(', hours', '')}) differ from the ones in src/markets.ts (${units})\n`)
})

test('a shared list only grows: its values may gain words and new values, and none goes', () => {
  const lists = json('build/lists.json')
  // A beta market uses the list, so only the list's own rule is said.
  const beta = { ...copy(), status: 'beta' }
  const grown = { ...lists, languages: { ...lists.languages, es: 'Castilian', tlh: 'Klingon' }, sizes: { s: 'S' } }
  assert.equal(run({ markets: [beta], lists: grown }, { markets: [beta] }).stderr, stale)
  const { es: _es, ...languages } = lists.languages
  const { sizes: _sizes, ...without } = grown
  assert.equal(run({ markets: [beta], lists: { ...lists, languages } }, { markets: [beta], lists: grown }).stderr, [
    'build/lists.json:',
    '  - /languages/es is gone, and on main: answers already given as es would stop fitting',
    '  - /languages/tlh is gone, and on main: answers already given as tlh would stop fitting',
    '  - /sizes is gone, and on main: answers already given from it would stop fitting',
    'A shared list only grows.',
    '',
  ].join('\n'))
  assert.equal(run({ markets: [beta], lists: without }, { markets: [beta], lists: grown }).stderr.includes('/sizes is gone'), true)
})

test('a market new here starts as beta and takes the next number after the highest on main', () => {
  const main = [copy(), { ...copy('weaving'), status: 'beta', number: 5 }]
  const fresh = (name: string, number: number, status = 'beta') => ({ ...copy(name), status, number })
  assert.equal(run({ markets: [main[0], fresh('felting', 6), fresh('sewing', 7)] }, { markets: main }).stderr, stale)
  assert.equal(run({ markets: [main[0], fresh('felting', 9)] }, { markets: main }).stderr, 'markets/felting.json:\n  - /number is 9, but a market new here takes the next number after the highest on main, 5: here 6\n')
  assert.equal(run({ markets: [main[0], fresh('felting', 6, 'live')] }, { markets: main }).stderr, 'markets/felting.json:\n  - is new and live: a market starts as beta; live is a promise made after it has been tried\n')
})

// Each case is a market of its own, named for the case, live on main unless it says otherwise, and
// changed here as the case says.

test('a market live on main may grow, and change its suggestions in any way: each of these passes', () => {
  const grown: { [name: string]: (market: any) => void } = {
    'new-field': (m) => {
      m.listing.colour = { piece: 'choice', values: ['red', 'blue'] }
      m.review.warm = { piece: 'choice', values: ['yes', 'no'], when: { again: ['yes'] } }
    },
    'new-value': (m) => m.listing.kind.values.push('shawl'),
    'new-per': (m) => {
      m.listing.price.per.push('pair')
      m.listing.deposit.per = ['item']
    },
    'new-role': (m) => m.roles.push({ role: 'shop', listings: 'offers' }),
    'wider-roles': (m) => {
      delete m.listing.photos.roles
      m.review.onTime.roles.push('client')
    },
    'wider-when': (m) => {
      m.listing.size.when.kind.push('hat')
      delete m.listing.size.when.wearer
      delete m.listing.area.when
    },
    'own-list-to-shared': (m) => (m.listing.languages.values = Object.keys(json('build/lists.json').languages)),
    'words': (m) => {
      m.summary = 'Knitters knit to measure.'
      delete m.description
      m.listing.area.ask.as.client.question = 'Roughly where are you?'
      m.listing.area.ask.as.client.start.radiusKm = 2
      delete m.listing.kind.ask
      m.listing.chest.ask = { label: 'Chest size' }
      m.listing.size.ask.labels.xl = 'Extra large'
      m.listing.meet.ask.start = { way: 'day' }
      m.preview = ['description']
      m.icon = 'scissors'
    },
    'order': (m) => {
      m.roles.reverse()
      m.listing = Object.fromEntries(Object.entries(m.listing).reverse())
      m.listing.kind.values.reverse()
    },
  }
  const main = Object.keys(grown).map((name) => copy(name))
  const here = Object.entries(grown).map(([name, change]) => {
    const market = copy(name)
    change(market)
    return market
  })
  // The test market's languages are the shared list; on main, this copy held them as its own.
  main[Object.keys(grown).indexOf('own-list-to-shared')]!.listing.languages.values = Object.keys(json('build/lists.json').languages)
  here[Object.keys(grown).indexOf('own-list-to-shared')]!.listing.languages.values = 'languages'
  // Beta on main: it may become live, change in any way, or go.
  const plain = (name: string) => ({ name, summary: 'Knitters knit to order.', status: 'beta', number: numberOf(name), roles: [{ role: 'knitter', listings: 'offers' }], listing: {} })
  main.push({ ...copy('beta-to-live'), status: 'beta' }, { ...copy('beta-breaks'), status: 'beta' }, { ...copy('beta-gone'), status: 'beta' })
  here.push(copy('beta-to-live'), plain('beta-breaks'))
  assert.equal(run({ markets: here }, { markets: main }).stderr, stale)
})

test('a market live on main only grows, on its rules: each of these fails, saying what broke and why', () => {
  const posted = (kind: string, rest: string) => `${kind}s already posted ${rest} would stop fitting`
  // A role is taken away from a market with no field kept for it, so only the role is said.
  const plain = (name: string) => ({ ...copy(name), listing: { description: { piece: 'text' } }, preview: undefined, review: undefined })
  const broken: [name: string, change: ((market: any) => void) | 'gone', messages: string[], from?: (name: string) => any][] = [
    ['gone', 'gone', ['is gone: its profiles, and all they posted, would be left with no market']],
    ['back-to-beta', (m) => (m.status = 'beta'), ['/status is beta: a live market never goes back']],
    ['renumbered', (m) => (m.number += 1000), [`/number is ${numberOf('renumbered') + 1000}, and ${numberOf('renumbered')} on main: apps tell markets apart by it, so a live market keeps its own`]],
    ['role-gone', (m) => m.roles.pop(), ['/roles: "client" is gone: every client profile would be left with no role'], plain],
    ['listings-swapped', (m) => (m.roles[1].listings = 'offers'), ["/roles: client's listings are offers, and requests on main: every client profile would change what it is"]],
    ['field-gone', (m) => {
      delete m.listing.yarns
      delete m.review.again
    }, [`/listing/yarns is gone: ${posted('listing', 'that hold yarns')}`, `/review/again is gone: ${posted('review', 'that hold again')}`]],
    ['piece-changed', (m) => (m.listing.days = { piece: 'text' }), [`/listing/days/piece is text, and number on main: ${posted('listing', 'that hold days')}`]],
    ['several-added', (m) => (m.listing.shop.several = true), [`/listing/shop takes several answers, and one answer on main: ${posted('listing', 'that hold shop')}`]],
    ['several-dropped', (m) => delete m.listing.wearer.several, [`/listing/wearer takes one answer, and several answers on main: ${posted('listing', 'that hold wearer')}`]],
    ['value-gone', (m) => {
      m.listing.kind.values = m.listing.kind.values.filter((v: string) => v !== 'hat')
      m.listing.languages.values = 'languages'
    }, [`/listing/kind/values: "hat" is gone: ${posted('listing', 'whose kind holds hat')}`, `/listing/languages/values: "xx" is gone: ${posted('listing', 'whose languages holds xx')}`], (name) => {
      // On main, its languages were a list of its own, with a value the shared list lacks.
      const market = copy(name)
      market.listing.languages.values = ['es', 'en', 'xx']
      return market
    }],
    ['per-gone', (m) => (m.listing.price.per = ['hour']), [`/listing/price/per: "item" is gone: ${posted('listing', 'whose price is per item')}`]],
    ['unit-changed', (m) => {
      m.listing.days.unit = 'hours'
      delete m.listing.chest.unit
    }, [
      '/listing/chest/unit is none, and centimetres on main: listings already posted that hold chest would keep their number and change its meaning',
      '/listing/days/unit is hours, and days on main: listings already posted that hold days would keep their number and change its meaning',
    ]],
    ['roles-narrowed', (m) => {
      m.listing.yarns.roles = ['knitter']
      m.review.again.roles = ['client']
    }, [
      '/listing/yarns/roles: client is left out: listings by client already posted that hold yarns would stop fitting',
      '/review/again/roles: knitter is left out: reviews of knitter already posted that hold again would stop fitting',
    ]],
    ['new-when', (m) => (m.listing.yarns.when = { kind: ['jumper'] }), [`/listing/yarns/when names kind, which it did not on main: ${posted('listing', 'that hold yarns, and whose kind is not jumper,')}`]],
    ['when-value-gone', (m) => (m.listing.size.when.kind = ['jumper']), [`/listing/size/when/kind: "cardigan" is gone: ${posted('listing', 'that hold size, and whose kind is cardigan,')}`]],
  ]
  const main = broken.map(([name, , , from = copy]) => from(name))
  const here = broken.flatMap(([name, change, , from = copy]) => {
    if (change === 'gone') return []
    const market = from(name)
    change(market)
    return [market]
  })
  const ran = run({ markets: here }, { markets: main })
  const expected = [
    ...broken.sort(([a], [b]) => (a < b ? -1 : 1)).map(([name, , messages]) => `markets/${name}.json, live on main:\n${[...messages].sort().map((message) => `  - ${message}\n`).join('')}`),
    closing,
  ]
  const sorted = (text: string) => text.split(/(?=^markets\/)/m).map((block) => block.split('\n').sort().join('\n'))
  assert.deepEqual(sorted(ran.stderr), sorted(expected.join('')))
  assert.equal(ran.status, 1)
})

test('with no copy of main, nothing is compared, and with one the check says how many markets are live there', () => {
  const ran = run({ markets: [copy()] })
  assert.equal(ran.stderr, stale)
  const dir = mkdtempSync(join(tmpdir(), 'markets-'))
  const main = mkdtempSync(join(tmpdir(), 'markets-'))
  try {
    for (const at of [dir, main]) {
      for (const path of ['build', 'markets']) mkdirSync(join(at, path))
      writeFileSync(join(at, 'build/lists.json'), JSON.stringify(json('build/lists.json')))
      writeFileSync(join(at, 'markets/knitting.json'), JSON.stringify(knitting))
    }
    writeFileSync(join(dir, 'build/market.schema.json'), JSON.stringify(json('build/market.schema.json')))
    writeFileSync(join(dir, 'build/icons.json'), JSON.stringify(json('build/icons.json')))
    writeFileSync(join(dir, 'directory.json'), ran.directory!)
    writeFileSync(join(dir, 'directory.md'), ran.md!)
    const script = fileURLToPath(new URL('../scripts/check.ts', import.meta.url))
    const check = (...args: string[]) => spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script, dir, ...args], { encoding: 'utf8' })
    assert.equal(check().stdout, '1 market files: each passes, and directory.json and directory.md are current\n')
    assert.equal(check(main).stdout, '1 market files: each passes, and directory.json and directory.md are current; 1 live on main, and each only grows\n')
  } finally {
    for (const at of [dir, main]) rmSync(at, { recursive: true, force: true })
  }
})
