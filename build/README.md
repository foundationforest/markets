# Build a market

How to build a market, from why it exists to the file and how to propose it. It is for people and
AIs who will build markets nobody here thought of, so it gives the reasons and leaves the judgment
to you. From [The file](#the-file) on, it is the format: what it says a file or an entry holds is a
**rule**, enforced by [`check.sh`](check.sh) on each market file, `checkEntry` on each entry
([From a program](#from-a-program)) or a test on every market's values, and said once, with its
reason; [`market.schema.json`](market.schema.json) and [`types.json`](types.json) hold it as data.
Which markets this repo takes is the Forest Foundation's call, by
[the line below](#which-markets-this-repo-takes). Everything else is advice, with its reason, for
you to weigh.

## What a market is

A market is one reputation under one name. A person's profiles are made from their seed, the secret
their app keeps: one profile per market and role, named by its label, `<market>/<role>`, and nothing
public links one profile to another. Apps, indexes and AIs read the market's file to know what its
listings and reviews hold, so everyone in a market writes the same shape.

## Privacy first

Anyone you deal with can learn who is behind your profile, and can then read everything that
profile did in that market: each listing, and each review of it. A narrower market shows each of
them less.

What carries from one profile to another is trust, by
[proofs](https://github.com/foundationforest/standard/blob/main/proofs/README.md) that name no
profile. A verification shows that a verifier stamped the seed behind a profile, such as for being
one real person. A reputation proof shows the average score an index gave to other profiles of the
same seed, a score that means what that index says it means; since the person picks which profiles
go in, it shows a good record, never a clean one. What stays in each market is its reviews and their
ratings, which are about skill.

So splitting a market restarts only the ratings, and ratings should restart when the skill changes.

## Where to draw the line

First read [`directory.md`](../directory.md), and the file of each market near yours, by what people
deal in or by how they deal: the market may be there. If not, ask two questions of the nearest,
about both sides of the deal:

1. **Good at the same things?** Leave out trust, which carries anyway, and compare what a good
   review of each would praise. If it would praise different things, being great at one tells you
   little about the other: split. A maths tutor and a physics tutor are praised alike, for
   explaining well and for the student's progress; a tutor and a tennis coach are not. The same
   question tells roles apart: a tennis partner and a tennis student are judged on different
   things, so a person who plays and takes lessons holds two profiles.
2. **Fine to show together?** If one profile holding both would tell the people you deal with
   something they would keep apart, split.

Both pass: it is one market, since splitting would restart ratings that should carry; a maths tutor
who adds physics shouldn't start from zero. A topic is then a field, not a market, and needing
different fields is no reason to split: [`when`](#follow-up-questions) asks each listing only what
fits it, and a review names its listing, so an index can still tell one topic's reviews from
another's.

Splitting costs a crowd: each market needs its own before anyone finds a deal in it. That is an
argument for launching few markets, not for merging two that fail a question. A dealing that could
go in either of two markets goes to the one where people already look for it.

| Dealings | Good at the same things? | Fine to show together? | So |
|---|---|---|---|
| A guest who pays for the bed, and one who works for it | No: one is judged on paying and on caring for the place, the other on the work and on living together | Yes | Two markets |
| Babysitting, and caring for an elderly person | No: keeping a child safe and busy says little about personal care and health | Yes | Two markets |
| School tutoring, and sports coaching | No: a coach is praised for technique and fitness, a tutor for explaining and grades | Yes | Two markets |
| Selling a jacket, and selling a car | No: a car is judged on more, its papers, history and mechanics | No: every jacket buyer would learn what you can afford | Two markets, and the car waits ([below](#which-markets-this-repo-takes)) |
| Seeing a doctor, and seeing a therapist | No: treating the body is not helping the mind | No: each would learn what the other treats you for | Two markets, and both wait: harm to health is not fixable tomorrow |

## Which markets this repo takes

Until a deal's money can wait in escrow, with an arbiter to settle a dispute, this repo takes only
markets where a deal gone wrong costs little. Each says whether it is `beta` or `live`, and the
directory shows which, so a person knows what they can rely on before they make a profile there.

**Beta** needs two things:

- **Small first:** nobody, on either side, risks more money or work than they could lose to a
  stranger without real harm before they get something. Small, rather than zero, works because a
  seed gives one profile per market and role, and a verifier that stamps each person once lets each
  person show one verified profile there: someone who takes the money and vanishes leaves a
  reported profile behind and can't start clean under a new verified one. That deters small
  amounts, not big ones.
- **Fixable tomorrow:** if it goes wrong, you try someone else.

**Live** needs all of that, and:

- **No money between people:** a paid dealing stays beta until escrow exists.
- **Polished, which here means tried:** listings and reviews posted in it end to end, through the
  app and through an AI.
- **It only grows** from then on ([Status](#status)).

A market that can't be beta waits for the service that would make it accountable, such as escrow
for a big price, and can be proposed once that exists.

## Naming

A name is plain words everyone knows. Read it as family, then kind: a family word comes first only
where people already start looking from it, as they look for help at home and then for repair or
cleaning (`home-repair`, `home-cleaning`), or for a stay and then for one they work for or one that
is free (`stays-work`, `stays-free`). A market that stands alone gets one or two plain words
(`tutoring`, `goods`), which claim no family. A family's first word alone is left to the family:
`home` would read as all of them. Pick a name that is still right when the market grows: `goods`
outlasts the first kind sold there.

A name and its roles' words make every profile's label, and a label makes the profile's key, so a
new name is a new market, at the cost of a split: ratings start again, while trust carries. A live
market is never removed, so a renamed one stays beside the new. That makes a rename costly, not
impossible, and the same goes for a role's word. The spelling is under [The file](#the-file).

## Roles

A role is `{ "role", "listings" }`, as in [knitting](#a-worked-example-knitting). `listings` says
what its listings are, so each side can find the other's: `offers`, what it gives, or `requests`,
what it looks for. Where people of one role look for each other, as tennis players do, they are
requests. Every listing is at `listing/<id>` in its profile's
[folder](https://github.com/foundationforest/standard/blob/main/folders/README.md#folders). Two
sides judged on different things are two roles ([question 1](#where-to-draw-the-line)).

## Writing fields

### Follow-up questions

A field can apply only after another field's answer. In knitting, a client who asks for socks is
asked the foot's length, and one who asks for a jumper the chest:

```json
"kind": { "type": "choice", "description": "What is knitted.", "values": ["jumper", "cardigan", "scarf", "hat", "socks"], "many": true },
"chest": { "type": "number", "description": "The wearer's chest, round its widest part, in centimetres.", "unit": "centimetres", "when": { "kind": ["jumper", "cardigan"] } },
"footLength": { "type": "number", "description": "The wearer's foot, heel to toe, in centimetres.", "unit": "centimetres", "when": { "kind": ["socks"] } }
```

An app asks `chest` right after `kind`, and only for a jumper or a cardigan; a scarf asks neither.
A chain works too, such as who it is for, then the kind, then a size. The rules are under
[The file](#the-file).

### What a field holds

A market file becomes the form a stranger fills in on a phone in a minute, the filters an index can
offer the other side, and what an AI reads to post for someone. So:

- **Write each description for an AI that has never seen the market**, so that from one sentence a
  person says it can post a listing that fits: what the field holds, in what unit or standard, and
  for whom.
- **Every number names its unit** ([a rule](#the-file)), so an app or an AI can show and convert it
  without reading the description; since a unit can't change once a market is live, a number
  posted keeps its meaning.
- **Store values that hold in every country**, and let apps and AIs translate: a foot's length in
  centimetres, not a shoe size that differs by country; a point for a place; a price in the person's
  own currency, which it keeps, since rates move.
- **Write values as lowercase English words joined by hyphens**, such as `in-person`, so their words
  read right and apps translate them. A list may be as long as people need, and grows by pull
  request when someone needs a value it lacks.
- **Copy the fields of apps people already use for that dealing**, across countries: they have
  learned what people ask. Then cut what Forest doesn't need, and what would tell strangers more
  about a person than the deal needs.
- **A picker (a `choice`) where people filter, text where they describe**, and `words` only for
  open tags. Yes or no is a picker of two values, `yes` and `no`.
- **Every field is one someone would miss.** More fields behind a form are fine when they make it
  simpler, as each kind above asks one measure.

### Reviews

Reviews, vouches and reports have [one shape in every market](#reviews-vouches-and-reports), and a
market may add fields to its reviews only. A field there is worth adding only for what a good one is
judged on, by role, the same thing [question 1](#where-to-draw-the-line) asks; the score and the
text say the rest.

## A worked example: knitting

1. **The dealing.** People ask a knitter for a jumper, a hat or socks made to their measure, and
   pick it up or have it shipped.
2. **The line.** The nearest dealing is selling clothes you own, judged on describing an item
   honestly and handing it over; a knitter is judged on the craft, the fit and the date. Being great
   at one tells you little about the other, so knitting is its own market. Jumpers and socks pass
   both questions, so they share it, and the kind is a field. The knitter and the client are judged
   on different things, so they are two roles.
3. **The launch line.** The client risks a deposit that covers the yarn, and pays the rest on
   handover; the knitter risks the work, and keeps what was knitted if the client never pays: small
   first, on both sides. A bad scarf means trying another knitter: fixable tomorrow. So it can be
   beta, and since money passes between people, it stays beta until escrow exists.
4. **The name.** People look for a knitter, not for crafts and then knitting, so it stands alone:
   `knitting`.
5. **The fields.** Take one sentence a client might say: "a merino jumper for my husband, chest 104,
   by December; I'm in Madrid and can pick it up." It holds a kind, a measure, a yarn, a date and a
   handover with a place, which shops that knit to order ask too, beside photos of past work. A
   measure in centimetres, unlike a letter size, also needs no wearer.
6. **The reviews.** A knitter is judged on the date and the fit, a client on paying: `onTime`,
   `daysLate` only when it came late, and `fits` for the knitter, `paid` for the client.
7. **The preview.** A client looks at what is knitted and at past work before the price.
8. **The trial.** Before you propose, fill in a listing as a knitter and as a client, search as
   each, review each, and run the check.

```json
{
  "name": "knitting",
  "description": "Knitters knit jumpers, cardigans, scarves, hats and socks to order, handed over in person or shipped.",
  "status": "beta",
  "roles": [
    { "role": "knitter", "listings": "offers" },
    { "role": "client", "listings": "requests" }
  ],
  "listing": {
    "description": { "type": "text", "description": "What is knitted, in what style and colours, and anything the knitter needs to know." },
    "price": { "type": "money", "description": "The price per item, or for the whole order.", "per": ["item"] },
    "deposit": { "type": "money", "description": "What the client pays before the knitting starts, such as the yarn's cost." },
    "kind": { "type": "choice", "description": "What is knitted.", "values": ["jumper", "cardigan", "scarf", "hat", "socks"], "many": true },
    "chest": { "type": "number", "description": "The wearer's chest, round its widest part, in centimetres.", "unit": "centimetres", "when": { "kind": ["jumper", "cardigan"] } },
    "head": { "type": "number", "description": "The wearer's head, round the forehead, in centimetres.", "unit": "centimetres", "when": { "kind": ["hat"] } },
    "footLength": { "type": "number", "description": "The wearer's foot, heel to toe, in centimetres.", "unit": "centimetres", "when": { "kind": ["socks"] } },
    "yarns": { "type": "words", "description": "The yarns, such as merino, alpaca or cotton." },
    "days": { "type": "number", "description": "How many days the knitter takes, from the order to handover.", "unit": "days", "roles": ["knitter"] },
    "due": { "type": "moment", "description": "When the client needs it by, or the span it may come in.", "roles": ["client"] },
    "photos": { "type": "file", "description": "Photos of work the knitter has done.", "many": true, "roles": ["knitter"] },
    "handover": { "type": "choice", "description": "How it is handed over: in person, shipped, or both.", "values": ["in-person", "shipped"], "many": true },
    "studio": { "type": "place", "description": "Where the knitter hands work over: anywhere in the circle they will go.", "radiusKm": 10, "roles": ["knitter"], "when": { "handover": ["in-person"] } },
    "home": { "type": "place", "description": "Roughly where the client lives.", "radiusKm": 1, "roles": ["client"], "when": { "handover": ["in-person"] } }
  },
  "preview": ["kind", "photos", "description", "price"],
  "review": {
    "onTime": { "type": "choice", "description": "Whether it came by the day agreed.", "values": ["yes", "no"], "roles": ["knitter"] },
    "daysLate": { "type": "number", "description": "How many days late it came.", "unit": "days", "roles": ["knitter"], "when": { "onTime": ["no"] } },
    "fits": { "type": "choice", "description": "Whether it fitted the measurements given.", "values": ["yes", "no"], "roles": ["knitter"] },
    "paid": { "type": "choice", "description": "Whether the client paid as agreed.", "values": ["yes", "no"], "roles": ["client"] }
  }
}
```

## The file

`markets/<name>.json` holds these keys and no others:

| Key | What it holds |
|---|---|
| `name` | Lowercase letters, digits and single hyphens, at most 64 characters, since it is half of every label, and the same as the file's, so no two markets share one ([Naming](#naming)). |
| `description` | What the dealing is, in one line. |
| `status` | `beta` or `live` ([Status](#status)). |
| `roles` | One role or several ([Roles](#roles)), each word spelled as a name is and listed once, since a label names one role. |
| `listing` | The fields of a listing, by name. |
| `preview` | Optional: names of `listing` fields, those that matter first ([below](#preview)). |
| `review` | Optional: fields a review here holds besides [the shared ones](#reviews-vouches-and-reports), by name. |

An entry holds only its market's fields and [the shared ones](#shared-names), and may leave out any
of them, so a person posts what they know and a field added later never makes an older entry stop
fitting. A review, a vouch and a report name their `subject`, since only it says who one is about.

A field is `{ "type", "description" }`: one of the [types](#types), and what it holds, in one line.
It may add:

- `"values"`, for a `choice` and only for one: the list to choose from. None is `other`, `either`,
  `both` or `unisex`, which a test on every market refuses: leave the field out when no value fits,
  and `many` says both, so a filter on one value never misses what such a value would hide. Values
  that don't overlap let a filter on one find all of it.
- `"labels"`, for a `choice` and only for one: how people read a value whose words are wrong, such
  as `{ "xl": "XL" }`. A value's words are the value with hyphens as spaces and a capital first
  letter, such as `New with tags`. Readers show a value's label where it has one, else its words.
- `"per"`, for a `money` field and only for one: what its amount may be for, such as
  `["hour", "session"]`. An amount may always leave `per` out, for the whole deal; with no list,
  it always does, as the price of a jacket.
- `"radiusKm"`, on every `place` field and only on one: the radius, in whole kilometres, a new place
  starts at before the person changes it ([Types](#types)), such as 2 for an item to pick up, 1 for
  a home, 5 for where people meet and 10 for where a pro works.
- `"unit"`, on every `number` field and only on one: one of the [units](#units), such as
  `"minutes"` ([why](#what-a-field-holds)).
- `"many": true`: a list of its type, such as several photos. Never on `words`, a list already.
- `"roles"`: the market's roles the field is for. In `listing`, only their listings hold it; in
  `review`, only reviews of a profile in them. Left out: every role.
- `"when"`: the field applies only when other `choice` fields of the same entry hold one of the
  values listed, such as `"when": { "kind": ["socks"] }`. With several fields named, all must
  match; a `many` field matches when any of its values does. It names only `choice` fields and
  their values, so an app knows ahead what each answer opens, and never in a loop, so a form can ask
  each field after those it depends on. A field that does not apply is never held: `checkEntry`
  refuses it, and an app drops it when an answer changes. With `roles` too, both must match, and if
  a field it names is kept to some roles, this one is kept to those or fewer, since for any other
  role it could never apply.

A field's name is a key in an entry's body: a lowercase letter, then letters and digits, at most 64
characters (`startTime`, not `start-time`). It is never `files`, which the standard keeps for an
entry's files ([Photos](#photos)), never `contact`, which every listing may hold
([Shared names](#shared-names)), and in `review` never a shared name.

### Preview

`preview` lists the `listing` fields that matter first, most needed first. A form asks them first,
each after any field it depends on through `when`, then the rest; a search result, a short list or
a spoken summary shows them first, of those the listing holds. It names content, never a screen
shape. Left out, it is `description`, `price`, then the `place` fields, of those the market has.
Write it only where that is wrong, such as with no price, or where photos or a topic matter first,
as in knitting.

### Status

`status` is `beta` or `live` ([which markets this repo takes](#which-markets-this-repo-takes)). A
beta market may change in any way; a pull request that makes listings or reviews already posted
stop fitting says so at its top, plainly, so their writers know which to post again.

A live market is a promise that whatever was posted in it keeps fitting and every profile in it
stays what it is. So a new market starts as beta, and a live one never goes back. A pull request to
a live market may add roles, fields, values, `per` values and labels, widen a field's `roles` or
`when`, and reword descriptions and labels. It may not remove or rename the market, a role, a field
or a value, change a role's `listings`, change a field's type, `many` or `unit`, narrow its `roles`
or `when`, or change a type in [`types.json`](types.json) a live market uses, beyond its
descriptions. [`check.sh`](check.sh) compares main with yours and fails on a new market that is
live, a live one gone back to beta, and any of these, with no exception: a live market that must
break becomes a new market, with a new name.

## Reviews, vouches and reports

The same in every market:

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `score`, `text`, `listing`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

- `subject` (text): the address of the profile it is about, in the same market, and the one field
  it must hold.
- `score` (number): the rating, `"1"` to `"10"` with at most one decimal, such as `"8.5"`.
- `text` (text): what the writer says.
- `listing` (text): the address of the listing a review is about,
  `<profile address>/listing/<id>`, whoever wrote it.

## Types

Every field is one of nine types, in [`types.json`](types.json). A program acts on a field by its
type, never its name, except for the [shared names](#shared-names).

| Type | A value | A program |
|---|---|---|
| `text` | text | searches it and shows it |
| `number` | decimal text, such as `"2.5"`, in its field's [unit](#units) | filters by range |
| `words` | a list of short words | filters by them |
| `choice` | one of the field's `values` | filters by it |
| `place` | `{ "lat", "lon", "radiusKm" }`, and `"area"` if wanted | matches circles that touch |
| `money` | `{ "amount", "currency", "per" }` | prints it and sorts by it |
| `moment` | a time, or `{ "from", "to" }` | filters by time |
| `file` | the SHA-256 of one of the entry's `files`, in lowercase hex ([Photos](#photos)) | fetches it and shows it |
| `hours` | `{ "zone", "slots": [ { "days", "from", "to" } ] }` | filters by day and time |

- Numbers, amounts and coordinates are decimal text, since an entry holds only whole numbers.
- `place`: a point, `lat` and `lon` in degrees, and `radiusKm`, a whole number of kilometres, both
  required; `area` is the name people know the area by, such as a town or a court, which an index
  shows and finds the place by. Radius 0 is that exact spot; otherwise the place is somewhere in the
  circle, or anywhere in it the person will go. Two places match when their circles touch: the
  distance between their points is at most the sum of their radii. A point is rough unless the
  radius is 0, and exact only for a public spot meant to be found, never a home's door. An app puts
  the centre near the person, not on them, picks that spot once and keeps it, since fresh random
  centres would average out to their home, and keeps their real spot inside the circle. Online is
  never a place: a market where people deal online too gives that its own `choice`, and asks for a
  place only `when` it is in person, as knitting does with `handover`.
- `money`: `currency` is a code such as `USD`; `per` is what the amount is for, one of its field's
  `per`, left out for the whole deal.
- `moment`: RFC 3339 with its zone, such as `2026-11-02T18:00:00+01:00`.
- `hours`: when a person is free each week. `zone` is a time zone name, such as `Europe/Madrid`;
  each slot's `days` are `monday` to `sunday`, and `from` and `to` are `HH:MM` in that zone.

## Units

The units a `number` field may name. The list grows when a market needs a unit it lacks: add it to
`UNITS` in [`src/markets.ts`](src/markets.ts), to the schema's list, which the check holds equal,
and to this table, in the market's pull request. No unit leaves while a live market uses it.

| Measures | Units |
|---|---|
| time | `minutes`, `hours`, `days` |
| nights of a stay | `nights`, which convert to no other unit |
| length | `centimetres`, `metres`, `kilometres` |
| area | `square-metres` |
| weight | `grams`, `kilograms` |
| a count | `people` |

## Photos

A photo is one of its entry's files. Give `listing` a field of type `file`, `many` for several, as
knitting's `photos`. A listing names each photo there by its SHA-256, and lists it in `files` as
[the standard names a file](https://github.com/foundationforest/standard/blob/main/folders/README.md#files):

```json
{
  "description": "A merino jumper, knitted to your chest.",
  "photos": ["04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86"],
  "files": [
    { "sha256": "04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86", "type": "image/jpeg", "size": 48213 }
  ]
}
```

The app writes the listing, then uploads the bytes to the folder's hosts, which keep them while a
current entry names them: a newer version that leaves a photo out lets it go, and a hash not in
`files` names nothing. A review holds files the same way.

## Shared names

These keep their meaning and type in every market, so a program finds them by name: the fields
every review, vouch and report holds, and three in `listing`, none ever `many`:

- `description` (text): the listing's main text, among any other text it holds. A market lists it,
  since every listing says something.
- `price` (money): what the listing costs, however it is paid, and the money a program sorts by.
  A market lists it where listings have a price.
- `contact` (text): how to reach the writer outside Forest, such as a phone, a handle or an
  email. Every listing may hold it, and no market lists it. It is public to anyone, and the same
  contact on two profiles links them, so it is the person's choice per listing.

## Propose

1. Write `markets/<name>.json`, or edit one as [Status](#status) allows.
2. Run `build/check.sh` (Node 22.18 or later, npm and git), and fix what it prints. It compares
   each market live on `origin/main` with yours, or on the commit you name, as in
   `build/check.sh HEAD~1`. Once every market passes, it rewrites a stale `directory.json` or
   `directory.md` and fails, so run it again. Never edit either by hand.
3. Run `npm test` in `build/`. [`test/content.test.ts`](test/content.test.ts) pins what the markets
   hold, so a pull request that changes a market changes it too.
4. Commit the market file, both directory files and the test.
5. Open a pull request. The check and the tests run again and must pass; then the Forest Foundation
   reviews it, as [the README](../README.md#who-decides-what) says, and merges it.

## From a program

`build/` is a private npm package, `@foundationforest/markets`, linked from a markets checkout, not
from npm:

```json
"dependencies": { "@foundationforest/markets": "file:../markets/build" }
```

Run `npm ci && npm run build` in that `build/`, then, with the [worked
example](#a-worked-example-knitting) as `markets/knitting.json`:

```ts
import { loadMarkets } from '@foundationforest/markets'

const markets = loadMarkets() // the checkout the package is in; loadMarkets(dir) reads another
markets.directory // directory.json
markets.market('knitting') // markets/knitting.json
markets.checkEntry('knitting', 'client', 'listing', { kind: 'socks' })
// 'kind takes a list, each different, each one of jumper, cardigan, scarf, hat, socks'
markets.checkEntry('knitting', 'client', 'listing', { kind: ['scarf'], chest: '96' })
// 'chest is only for a listing whose kind is jumper or cardigan'
markets.checkEntry('knitting', 'client', 'review', { subject, onTime: 'no', daysLate: '3' }, 'knitter')
// null
```

A program reads the markets at the commit its checkout holds.

A page reads no files, and its content security policy may forbid `eval`. It imports
`@foundationforest/markets/browser` and gives it the same files as data: `directory.json`,
`build/types.json`, and the file of each market the directory lists. It throws when one of those is
missing.

```ts
import { loadMarkets } from '@foundationforest/markets/browser'

const markets = loadMarkets({ directory, types, markets: [knitting /* , … */] })
```

Both entries run the same code. It imports nothing, makes no code from strings, and reads
`build/types.json` as data, so a page and a program give every entry the same answer.

`checkEntry(market, role, kind, body, aboutRole?)` checks a listing, a review, a vouch or a report
by a `role` profile as this manual says, and answers `null` when it fits, else the first field that
does not, in plain words. For a review, `aboutRole` is the role of the profile it is about: a field
kept for some roles is checked against it, and goes unchecked without it. Whether `subject`, or the
profile in `listing`, is an address, and the body's `files`, are
[the standard's](https://github.com/foundationforest/standard/blob/main/folders/README.md) checks.

The package also exports `SHARED`, the fields each kind holds in every market beyond its market's,
as a market's fields are written: a listing's `contact`, and what every review, vouch and report
holds; and `UNITS`, the units a number field may name. `previewOf(market)` gives the names of a
market's listing fields that matter first, as [Preview](#preview) says. `npm test` runs
its tests, on a test market of their own, [`test/knitting.json`](test/knitting.json), shaped to hold
every key a field may hold rather than as a model; `npm run check` type-checks the package, and the
browser entry again without Node's types.
