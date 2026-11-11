// build/check.sh's check, scripts/check.ts, on checkouts made for each case from the test market,
// knitting.json, with this checkout's build/types.json and build/market.schema.json unless a case
// gives its own, and its build/icons.json; and, for the rule that a market live on main only grows, a copy of main made the
// same way. A checkout made here has no directory yet, so one whose markets all pass fails only with
// both directory files stale.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { UNITS } from '../src/markets.ts'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const knitting = JSON.parse(readFileSync(new URL('knitting.json', import.meta.url), 'utf8'))
/**
 * Each market's number, by its name: the test market's own for it, and the next for each name after,
 * so a copy on main and the same copy here hold the same number, and no two copies share one.
 */
const numbers = new Map<string, number>([[knitting.name, knitting.number]])
const numberOf = (name: string): number => numbers.get(name) ?? numbers.set(name, Math.max(...numbers.values()) + 1).get(name)!
/** The highest number of `markets`, as a market new beside them takes the next. */
const highest = (markets: any[]) => Math.max(...markets.map((market) => market.number))
/**
 * A copy of the test market to change, by another name if given, with that name's number. Only the
 * test market keeps its icon, since no two markets share one.
 */
const copy = (name = 'knitting'): any => {
  const market = { ...structuredClone(knitting), name, number: numberOf(name) }
  if (name !== knitting.name) delete market.icon
  return market
}

type Checkout = { markets: any[]; types?: object; schema?: object }

/** What the check prints for `checkout`, compared with `main` when given, and the directory it writes. */
const run = (checkout: Checkout, main?: Checkout) => {
  const dirs: string[] = []
  const make = ({ markets, types = json('build/types.json'), schema = json('build/market.schema.json') }: Checkout) => {
    const dir = mkdtempSync(join(tmpdir(), 'markets-'))
    dirs.push(dir)
    for (const path of ['build', 'markets']) mkdirSync(join(dir, path))
    writeFileSync(join(dir, 'build/types.json'), JSON.stringify(types))
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

const stale = 'directory.json:\n  - was stale: rewritten from the market files; commit it\ndirectory.md:\n  - was stale: rewritten from the market files; commit it\n'
const closing = 'A market live on main only grows: one that must break becomes a new market, with a new name.\n'

test('the test market passes, and the directory holds what a list of markets shows: summary, status, icon and number', () => {
  const plain = { ...copy('weaving'), status: 'beta', summary: 'Weavers weave cloth to order' }
  const ran = run({ markets: [copy(), plain] })
  assert.equal(ran.stderr, stale)
  const listed = JSON.parse(ran.directory!).markets
  const { summary, description, roles } = knitting
  assert.deepEqual(listed[0], { name: 'knitting', summary, description, status: 'live', icon: 'yarn', number: 1, roles })
  assert.deepEqual(Object.keys(listed[0]), ['name', 'summary', 'description', 'status', 'icon', 'number', 'roles'])
  // With no icon, the directory leaves it out.
  assert.deepEqual(Object.keys(listed[1]), ['name', 'summary', 'description', 'status', 'number', 'roles'])
  assert.deepEqual(listed.map((m: any) => [m.name, m.status]), [['knitting', 'live'], ['weaving', 'beta']])
  assert.match(ran.md!, /^A live market needs no payment between people yet, is polished, and from now on only grows\. A$/m)
  // A line each: the summary, the description, each a sentence, and the roles.
  const line = (name: string, status: string, summary: string) => `- [\`${name}\`](markets/${name}.json) (${status}): ${summary} ${description} Roles: knitter (offers), client (requests).`
  assert.ok(ran.md!.split('\n').includes(line('knitting', 'live', summary)))
  assert.ok(ran.md!.split('\n').includes(line('weaving', 'beta', 'Weavers weave cloth to order.')))
})

test('a market says whether it is live or beta', () => {
  const { status: _status, ...none } = copy()
  assert.equal(run({ markets: [none] }).stderr, 'markets/knitting.json:\n  - the file: "status" is missing\n')
  assert.equal(run({ markets: [{ ...copy(), status: 'alpha' }] }).stderr, 'markets/knitting.json:\n  - /status must be one of "live", "beta"\n')
})

test('every number names its unit, from the shared list, and no other field names one', () => {
  const market = copy()
  delete market.listing.days.unit
  delete market.review.daysLate.unit
  market.listing.footLength.unit = 'weeks'
  market.listing.description.unit = 'minutes'
  assert.equal(run({ markets: [market] }).stderr, [
    'markets/knitting.json:',
    '  - /listing/description: "unit" is only for a number field',
    `  - /listing/footLength/unit must be one of ${UNITS.map((unit) => JSON.stringify(unit)).join(', ')}`,
    '  - /listing/days: "unit" is missing',
    '  - /review/daysLate: "unit" is missing',
    '',
  ].join('\n'))
})

test("the schema's units are the package's", () => {
  const schema = json('build/market.schema.json')
  schema.$defs.field.properties.unit.enum = UNITS.filter((unit) => unit !== 'people')
  const units = UNITS.join(', ')
  assert.equal(run({ markets: [copy()], schema }).stderr, `build/market.schema.json:\n  - its units (${units.replace(', people', '')}) differ from the ones in src/markets.ts (${units})\n`)
})

test('the check refuses labels on a field that is not a choice', () => {
  const market = copy()
  market.listing.yarns.labels = { merino: 'Merino' }
  const ran = run({ markets: [market] })
  assert.equal(ran.stderr, 'markets/knitting.json:\n  - /listing/yarns: "labels" is only for a choice field\n')
  assert.equal(ran.status, 1)
})

test('the check refuses a label for a value its field does not list', () => {
  const market = copy()
  market.listing.size.labels = { ...market.listing.size.labels, xxl: 'XXL' }
  const ran = run({ markets: [market] })
  assert.equal(ran.stderr, `markets/knitting.json:\n  - /listing/size/labels: "xxl" is not one of size's values\n`)
  assert.equal(ran.status, 1)
})

test('range is only for a number field, and never with many; price never holds many, since it is always a list', () => {
  const market = copy()
  market.listing.price.many = true
  market.listing.yarns.range = true
  market.listing.days.range = true
  market.listing.days.many = true
  assert.equal(run({ markets: [market] }).stderr, [
    'markets/knitting.json:',
    '  - /listing/days: "range" and "many" never go together: a field holds a range or a list, never a list of them',
    '  - /listing/yarns: "range" is only for a number field',
    '  - /listing/price must not hold "many": price is a shared name, always a list of one or more, as the format sets it',
    '',
  ].join('\n'))
  // The test market, whose age takes a range, passes: the first test.
  assert.equal(knitting.listing.age.range, true)
})

test('an icon is one of the Phosphor icons in build/icons.json, and no two markets share one', () => {
  assert.equal(run({ markets: [{ ...copy(), icon: 'knitting-needles' }] }).stderr, 'markets/knitting.json:\n  - /icon: "knitting-needles" is not a Phosphor icon: build/icons.json lists them\n')
  const shared = 'no two markets share one, so a list of them tells each apart'
  const markets = [copy(), { ...copy('weaving'), icon: 'yarn' }, { ...copy('spinning'), icon: 'yarn' }, { ...copy('sewing'), icon: 'needle' }, copy('felting')]
  assert.equal(run({ markets }).stderr, [
    'markets/knitting.json:',
    `  - /icon: "yarn" is also the icon of spinning and weaving: ${shared}`,
    'markets/spinning.json:',
    `  - /icon: "yarn" is also the icon of knitting and weaving: ${shared}`,
    'markets/weaving.json:',
    `  - /icon: "yarn" is also the icon of knitting and spinning: ${shared}`,
    '',
  ].join('\n'))
})

test('a market has a summary, one line of at most 80 characters, and a description of any length', () => {
  const line = (length: number) => `Knitters knit ${'a'.repeat(length - 'Knitters knit .'.length)}.`
  const description = `What an AI needs to know: ${'more, '.repeat(30)}and the end.`
  assert.equal(run({ markets: [{ ...copy(), summary: line(80), description }] }).stderr, stale)
  assert.equal(run({ markets: [{ ...copy(), summary: line(81) }] }).stderr, [
    'markets/knitting.json:',
    '  - /summary must be at most 80 characters: an app shows it where someone picks a market, and the description says the rest',
    '',
  ].join('\n'))
  assert.equal(run({ markets: [{ ...copy(), summary: 'Knitters knit.\nTo order.' }] }).stderr, 'markets/knitting.json:\n  - /summary must be one line of text, not only spaces\n')
  const { summary: _summary, ...none } = copy()
  assert.equal(run({ markets: [none] }).stderr, 'markets/knitting.json:\n  - the file: "summary" is missing\n')
})

test('a market has a number, a whole number from 1 that no other market holds', () => {
  for (const number of [0, -1, 1.5, '3', null]) {
    assert.equal(run({ markets: [{ ...copy(), number }] }).stderr, 'markets/knitting.json:\n  - /number must be a whole number from 1\n')
  }
  const { number: _number, ...none } = copy()
  assert.equal(run({ markets: [none] }).stderr, 'markets/knitting.json:\n  - the file: "number" is missing\n')
  const shared = 'no two markets share one, since apps tell markets apart by it'
  const markets = [copy(), { ...copy('weaving'), number: 1 }, { ...copy('spinning'), number: 1 }, copy('sewing')]
  assert.equal(run({ markets }).stderr, [
    'markets/knitting.json:',
    `  - /number: 1 is also the number of spinning and weaving: ${shared}`,
    'markets/spinning.json:',
    `  - /number: 1 is also the number of knitting and weaving: ${shared}`,
    'markets/weaving.json:',
    `  - /number: 1 is also the number of knitting and spinning: ${shared}`,
    '',
  ].join('\n'))
})

test('a market new here takes the next number after the highest on main, and those new here the next ones', () => {
  // Main's highest is 5, held by a beta market that this checkout leaves out: it still counts.
  const main = [copy(), { ...copy('weaving'), status: 'beta', number: 5 }, { ...copy('spinning'), number: 3 }]
  const kept = [main[0], main[2]]
  const fresh = (name: string, number: number) => ({ ...copy(name), status: 'beta', number })
  assert.equal(run({ markets: [...kept, fresh('felting', 6)] }, { markets: main }).stderr, stale)
  assert.equal(run({ markets: [...kept, fresh('felting', 7), fresh('sewing', 6)] }, { markets: main }).stderr, stale)
  const takes = (number: number, here: string) => `/number is ${number}, but a market new here takes the next number after the highest on main, 5: here ${here}`
  assert.equal(run({ markets: [...kept, fresh('felting', 9)] }, { markets: main }).stderr, `markets/felting.json:\n  - ${takes(9, '6')}\n`)
  assert.equal(run({ markets: [...kept, fresh('felting', 2)] }, { markets: main }).stderr, `markets/felting.json:\n  - ${takes(2, '6')}\n`)
  assert.equal(run({ markets: [...kept, fresh('felting', 6), fresh('sewing', 8)] }, { markets: main }).stderr, `markets/sewing.json:\n  - ${takes(8, '6 and 7')}\n`)
})

// Each case is a market of its own, named for the case, live on main unless it says otherwise, and
// changed here as the case says.

test('a market live on main may grow: each of these changes passes', () => {
  const grown: { [name: string]: (market: any) => void } = {
    'new-field': (m) => {
      m.listing.colour = { type: 'choice', description: 'The colour of the yarn.', values: ['red', 'blue'] }
      m.review.warm = { type: 'choice', description: 'Whether it is warm.', values: ['yes', 'no'], when: { again: ['yes'] } }
    },
    'new-value': (m) => m.listing.kind.values.push('shawl'),
    'new-per': (m) => {
      m.listing.price.per.push('pair')
      m.listing.deposit.per = ['item']
    },
    'new-label': (m) => (m.listing.kind.labels = { socks: 'A pair of socks' }),
    'reworded': (m) => {
      m.summary = 'Knitters knit to measure.'
      m.description = 'Knitters knit to order.'
      m.listing.days.description = 'How long the knitting takes.'
      m.listing.size.labels.xl = 'Extra large'
    },
    'labels-gone': (m) => delete m.listing.size.labels,
    'new-role': (m) => m.roles.push({ role: 'shop', listings: 'offers' }),
    'wider-roles': (m) => {
      delete m.listing.photos.roles
      m.review.onTime.roles.push('client')
    },
    'wider-when': (m) => {
      m.listing.size.when.kind.push('hat')
      delete m.listing.size.when.wearer
      delete m.listing.studio.when
    },
    'radius': (m) => (m.listing.studio.radiusKm = 20),
    'range-added': (m) => (m.listing.days.range = true),
    'icon-added': (m) => (m.icon = 'scissors'),
    'preview': (m) => (m.preview = ['description', 'kind']),
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
  // Beta on main: it may become live, change in any way, or go; and a new market may start as beta.
  const plain = (name: string, status: string) => ({ name, summary: 'Knitters knit to order.', description: 'Knitters knit to order.', status, number: numberOf(name), roles: [{ role: 'knitter', listings: 'offers' }], listing: {} })
  main.push({ ...copy('beta-to-live'), status: 'beta' }, { ...copy('beta-breaks'), status: 'beta' }, { ...copy('beta-gone'), status: 'beta' })
  // An icon is display, and no entry holds it: a live market may change it or drop it.
  main.push({ ...copy('icon-changed'), icon: 'needle' }, { ...copy('icon-gone'), icon: 'hoodie' })
  here.push({ ...copy('icon-changed'), icon: 'sock' }, copy('icon-gone'))
  // A beta market may change its number too; a new one takes the next after main's highest.
  main.push({ ...copy('beta-renumbered'), status: 'beta' })
  const top = highest(main)
  here.push(copy('beta-to-live'), plain('beta-breaks', 'beta'), { ...plain('new-beta', 'beta'), number: top + 1 }, { ...copy('beta-renumbered'), status: 'beta', number: top + 2 })
  assert.equal(run({ markets: here }, { markets: main }).stderr, stale)
})

test('a market live on main only grows: each of these changes fails, saying what broke and why', () => {
  const posted = (kind: string, rest: string) => `${kind}s already posted ${rest} would stop fitting`
  // A role is taken away from a market with no field kept for it, so only the role is said.
  const plain = (name: string) => ({ ...copy(name), listing: { description: knitting.listing.description }, preview: undefined, review: undefined })
  const broken: [name: string, change: ((market: any) => void) | 'gone', messages: string[], from?: (name: string) => any][] = [
    ['gone', 'gone', ['is gone: its profiles, and all they posted, would be left with no market']],
    ['renamed', 'gone', ['is gone: its profiles, and all they posted, would be left with no market']],
    ['back-to-beta', (m) => (m.status = 'beta'), ['/status is beta: a live market never goes back']],
    ['role-gone', (m) => m.roles.pop(), ['/roles: "client" is gone: every client profile would be left with no role'], plain],
    ['role-renamed', (m) => (m.roles[1].role = 'customer'), ['/roles: "client" is gone: every client profile would be left with no role'], plain],
    ['listings-swapped', (m) => (m.roles[1].listings = 'offers'), ["/roles: client's listings are offers, and requests on main: every client profile would change what it is"]],
    ['field-gone', (m) => {
      m.listing.yarn = m.listing.yarns
      delete m.listing.yarns
      delete m.review.again
    }, [
      `/listing/yarns is gone: ${posted('listing', 'that hold yarns')}`,
      `/review/again is gone: ${posted('review', 'that hold again')}`,
    ]],
    ['retyped', (m) => (m.listing.days = { type: 'text', description: 'How many days the knitting takes.' }), [
      `/listing/days/type is text, and number on main: ${posted('listing', 'that hold days')}`,
    ]],
    ['many-added', (m) => (m.listing.kind.many = true), [`/listing/kind holds a list, and one value on main: ${posted('listing', 'that hold kind')}`]],
    ['renumbered', (m) => (m.number += 1000), [`/number is ${numberOf('renumbered') + 1000}, and ${numberOf('renumbered')} on main: apps tell markets apart by it, so a live market keeps its own`]],
    ['many-dropped', (m) => delete m.listing.wearer.many, [`/listing/wearer holds one value, and a list on main: ${posted('listing', 'that hold wearer')}`]],
    ['range-gone', (m) => delete m.listing.age.range, [`/listing/age takes no range, and a range on main: ${posted('listing', 'whose age is a range')}`]],
    ['value-gone', (m) => {
      m.listing.kind.values = m.listing.kind.values.filter((v: string) => v !== 'hat')
      m.listing.wearer.values[2] = 'kids'
      delete m.listing.age.when
    }, [
      `/listing/wearer/values: "children" is gone: ${posted('listing', 'whose wearer holds children')}`,
      `/listing/kind/values: "hat" is gone: ${posted('listing', 'whose kind is hat')}`,
    ]],
    ['per-gone', (m) => (m.listing.price.per = ['hour']), [`/listing/price/per: "item" is gone: ${posted('listing', 'whose price is per item')}`]],
    ['unit-changed', (m) => (m.listing.days.unit = 'hours'), [
      '/listing/days/unit is hours, and days on main: listings already posted that hold days would keep their number and change its meaning',
    ]],
    ['roles-narrowed', (m) => {
      m.listing.yarns.roles = ['knitter']
      m.review.again.roles = ['client']
    }, [
      '/listing/yarns/roles: client is left out: listings by client already posted that hold yarns would stop fitting',
      '/review/again/roles: knitter is left out: reviews of knitter already posted that hold again would stop fitting',
    ]],
    ['new-when', (m) => (m.listing.yarns.when = { kind: ['jumper'] }), [
      `/listing/yarns/when names kind, which it did not on main: ${posted('listing', 'that hold yarns, and whose kind is not jumper,')}`,
    ]],
    ['when-names-more', (m) => (m.listing.size.when.handover = ['in-person']), [
      `/listing/size/when names handover, which it did not on main: ${posted('listing', 'that hold size, and whose handover is not in-person,')}`,
    ]],
    ['when-value-gone', (m) => (m.listing.size.when.kind = ['jumper']), [
      `/listing/size/when/kind: "cardigan" is gone: ${posted('listing', 'that hold size, and whose kind is cardigan,')}`,
    ]],
  ]
  const main = broken.map(([name, , , from = copy]) => from(name))
  const here = broken.flatMap(([name, change, , from = copy]) => {
    if (change === 'gone') return []
    const market = from(name)
    change(market)
    return [market]
  })
  // Renamed, it is a new market, which starts as beta and takes the next number: as live, it fails too.
  const top = highest(main)
  here.push({ ...copy('renamed-again'), status: 'beta', number: top + 1 }, { ...copy('new-live'), number: top + 2 })
  const ran = run({ markets: here }, { markets: main })
  const expected = [
    'markets/new-live.json:\n  - is new and live: a market starts as beta; live is a promise made after it has been tried\n',
    ...broken
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([name, , messages]) => `markets/${name}.json, live on main:\n${messages.map((message) => `  - ${message}\n`).join('')}`),
    closing,
  ]
  assert.equal(ran.stderr, expected.join(''))
  assert.equal(ran.status, 1)
})

test('a type a live market uses stays as it is on main, but for its descriptions', () => {
  const types = json('build/types.json')
  const narrowed = structuredClone(types)
  narrowed.$defs.number.pattern = '^(0|[1-9][0-9]*)(\\.[0-9]+)?$'
  narrowed.$defs.place.required.push('area')
  const ran = run({ markets: [copy()], types: narrowed }, { markets: [copy()] })
  assert.equal(ran.stderr, [
    'build/types.json, used by markets live on main:',
    "  - /$defs/number differs from main's beyond its descriptions, and knitting uses it: entries already posted could stop fitting; add a new type instead",
    "  - /$defs/place differs from main's beyond its descriptions, and knitting uses it: entries already posted could stop fitting; add a new type instead",
    '',
  ].join('\n'))

  // Reworded, it passes; and so does a change to a type no live market uses, here hours.
  const reworded = structuredClone(types)
  reworded.$defs.number.description = 'A number as decimal text.'
  reworded.$defs.place.properties.area.description = 'The name of the area.'
  reworded.$defs.hours.properties.zone.pattern = '^[A-Za-z]+(/[A-Za-z_]+)*$'
  const { hours: _hours, ...listing } = copy().listing
  const noHours = { ...copy(), listing }
  assert.equal(run({ markets: [noHours], types: reworded }, { markets: [noHours] }).stderr, stale)
  // A beta market on main holds no type to what it was.
  const beta = { ...noHours, status: 'beta' }
  narrowed.$defs.hours.properties.zone.pattern = '^[A-Za-z]+$'
  assert.equal(run({ markets: [beta], types: narrowed }, { markets: [beta] }).stderr, stale)
})

test('a type a live market uses through another is held too', () => {
  const types = json('build/types.json')
  types.$defs.text = { description: 'Text, as a time of day.', $ref: '#/$defs/hours/$defs/time' }
  const changed = structuredClone(types)
  changed.$defs.hours.$defs.time.pattern = '^[0-9]{2}:[0-9]{2}$'
  const plain = { name: 'plain', summary: 'A market of text alone.', description: 'A market of text alone.', status: 'live', number: 1, roles: [{ role: 'writer', listings: 'offers' }], listing: { description: { type: 'text', description: 'The text.' } } }
  assert.equal(run({ markets: [plain], types: changed }, { markets: [plain], types }).stderr, [
    'build/types.json, used by markets live on main:',
    "  - /$defs/hours differs from main's beyond its descriptions, and plain uses it: entries already posted could stop fitting; add a new type instead",
    '',
  ].join('\n'))
})

test('with no copy of main, nothing is compared, and with one the check says how many markets are live there', () => {
  const ran = run({ markets: [{ ...copy(), status: 'beta' }] })
  assert.equal(ran.stderr, stale)
  // Run again on a checkout whose directory is current, to see the line said when everything passes.
  const dir = mkdtempSync(join(tmpdir(), 'markets-'))
  const main = mkdtempSync(join(tmpdir(), 'markets-'))
  try {
    for (const at of [dir, main]) {
      for (const path of ['build', 'markets']) mkdirSync(join(at, path))
      writeFileSync(join(at, 'build/types.json'), JSON.stringify(json('build/types.json')))
      writeFileSync(join(at, 'markets/knitting.json'), JSON.stringify(knitting))
    }
    writeFileSync(join(dir, 'build/market.schema.json'), JSON.stringify(json('build/market.schema.json')))
    writeFileSync(join(dir, 'build/icons.json'), JSON.stringify(json('build/icons.json')))
    writeFileSync(join(dir, 'directory.json'), ran.directory!.replace('"beta"', '"live"'))
    writeFileSync(join(dir, 'directory.md'), ran.md!.replace('(beta)', '(live)'))
    const script = fileURLToPath(new URL('../scripts/check.ts', import.meta.url))
    const check = (...args: string[]) => spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script, dir, ...args], { encoding: 'utf8' })
    assert.equal(check().stdout, '1 market files: each passes, and directory.json and directory.md are current\n')
    assert.equal(check(main).stdout, '1 market files: each passes, and directory.json and directory.md are current; 1 live on main, and each only grows\n')
  } finally {
    for (const at of [dir, main]) rmSync(at, { recursive: true, force: true })
  }
})
