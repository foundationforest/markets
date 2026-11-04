# Build a market

How to write a market file and propose it. [`market.schema.json`](market.schema.json) is its
format, and [`types.json`](types.json) its types.

## Is it a market

A person holds one profile per market and role, and nothing public links them, so a reputation in
one market counts in another only if the person shows it there, with a reputation proof. Keep a
market as narrow as the dealing people look for, never wider to pool reputation.

First check [`directory.md`](../directory.md): the market may be there. If not, take the nearest
one and ask:

1. Is it a different dealing, one people look for on its own, as they look for a tutor apart from
   a coach?
2. Would a good one be praised for different things?
3. Would a person want the two kept from each other?

Any yes: it is a new market. All no: it is the same market, and your topic is a field. Posts that
need different fields are no reason to split: women's boots and men's coats are one market, and
[`when`](#the-file) asks each post only what fits it. A review names its post, so an index can
still tell plumbing from painting.

## Naming

A name says what the dealing is, in the words people use: usually two words, such as
`home-repair`, sometimes one, such as `tutoring`. Add the second word when the first could mean
another dealing. A topic is never in a name; it is a field. A name is lowercase letters, digits and
single hyphens, at most 64 characters, and no other market's.

Once a market is merged, its name and its roles' words never change, since they are part of every
profile's key. Anything else may change. A pull request that makes existing posts or reviews stop
fitting, by removing, retyping or narrowing anything, says so at its top, plainly: which ones stop
fitting until they are written again.

## Roles

```json
"roles": [
  { "role": "tutor", "posts": "offers" },
  { "role": "student", "posts": "requests" }
]
```

- `role` is any word, spelled as a name is. A person holds one profile per role, labelled
  `<market>/<role>`.
- `posts` says how to read the role's posts: `offers` (what it gives), `requests` (what it looks
  for), or `posts` (plain posts). Every post is at `post/<id>` in its profile's
  [folder](https://github.com/foundationforest/standard/blob/main/folders/README.md#folders).

## What the file becomes

A market file becomes two things: the form a stranger fills in on a phone in a minute, and the
filters the other side searches with. So:

- Start from how the best marketplaces for that dealing ask today, across countries, not in one,
  then cut what Forest doesn't need. A market serves every country, so each field holds in all.
- A picker (a `choice`) where people filter, text where they describe.
- Each field holds what a person can give without effort, in one standard that works in every
  country, and apps and AIs translate for people: the phone gives a point, the label a size, and
  the person their price in their own currency, which money keeps since rates move. A field names
  its standard in its description, such as shoe sizes in centimetres, so an AI converts from others.
- Every field is one someone would miss. More fields behind the form are fine when they make it
  simpler: clothing asks one size question, and five fields behind it hold the answer.
- Use [`when`](#the-file) where a question only makes sense after an answer, such as a shoe size
  after the kind of item. Most markets need none, or one.
- Before you propose, fill in a post as each role, and search as the other side.

## The file

`markets/<name>.json` holds these keys and no others:

| Key | What it holds |
|---|---|
| `name` | The name, the same as the file's ([Naming](#naming)). |
| `description` | What the dealing is, in one line. |
| `roles` | One role or several ([Roles](#roles)). |
| `post` | The fields of a post, by name. |
| `preview` | Optional: the `post` fields that matter first ([below](#preview)). |
| `review` | Optional: fields a review here holds besides [the shared ones](#reviews-vouches-and-reports), by name. |

A field is `{ "type", "description" }`: one of the [types](#types), and what it holds, in one line.
It may add:

- `"values"`, for a `choice` and only for one: the list to choose from. Values never overlap, and
  none is `other`, `either` or `both`: leaving the field out says other, and `many` says both.
- `"labels"`, for a `choice` and only for one: how people read a value whose words are wrong,
  such as `{ "xl": "XL" }`. A value's words are the value with hyphens as spaces and a capital
  first letter, such as `New with tags`. Readers show a value's label where the field has one,
  otherwise the value in words.
- `"per"`, for a `money` field and only for one: what its amount may be for, such as
  `["hour", "session"]`. An amount may always leave `per` out, for the whole deal; with no list,
  it always does, as the price of a jacket.
- `"radiusKm"`, on every `place` field and only on one: the radius, in whole kilometres, a new
  place starts at before the person changes it ([Types](#types)), such as 2 for an item to pick up,
  1 for a home, 5 for where people meet and 10 for where a pro works.
- `"many": true`: a list of its type, such as several photos. Never on `words`, a list already.
- `"roles"`: the roles the field is for. In `post`, only their posts hold it; in `review`, only
  reviews of a profile in them. Left out: every role.
- `"when"`: the field applies only when other `choice` fields of the same entry hold one of the
  values listed, such as `"when": { "kind": ["boots", "trainers"] }`. With several fields named,
  all must match; a `many` field matches when any of its values does. It names only `choice`
  fields, so an app knows ahead what each answer opens, and a chain works: who it is for, then the
  kind, then a size. A field that does not apply is never held: the check rejects it, and an app
  drops it when an answer changes. An app asks it right after the fields it depends on. With
  `roles` too, both must match.

```json
"post": {
  "description": { "type": "text", "description": "What the session covers." },
  "price": { "type": "money", "description": "The price per hour or per session.", "per": ["hour", "session"] },
  "levels": { "type": "choice", "description": "The levels taught.", "values": ["beginner", "advanced"], "many": true },
  "mode": { "type": "choice", "description": "In person, online, or both.", "values": ["in-person", "online"], "many": true },
  "place": { "type": "place", "description": "Where sessions can be held.", "radiusKm": 5, "when": { "mode": ["in-person"] } },
  "degrees": { "type": "text", "description": "Degrees or certificates the tutor holds.", "roles": ["tutor"] }
},
"preview": ["levels", "description", "price", "mode", "place"],
"review": {
  "prepared": { "type": "choice", "description": "Whether the tutor came prepared.", "values": ["yes", "no"], "roles": ["tutor"] }
}
```

A field's name is a key in an entry's body: a lowercase letter, then letters and digits, at most 64
characters (`startTime`, not `start-time`). It is never `files`, which the standard keeps for an
entry's files ([Photos](#photos)), never `contact`, which every post may hold
([Shared names](#shared-names)), and in `review` never a shared name.

### Preview

`preview` lists the `post` fields that matter first, most needed first. A form asks them first,
each after any field it depends on through `when`, then the rest; a search result, a short list or
a spoken summary shows them first, of those the post holds. It names content, never a screen shape.
Left out, it is `description`, `price`, then the `place` fields, of those the market has. Write it
only where that is wrong, such as with no price, or where photos or a topic matter first, like
`levels` above.

## Reviews, vouches and reports

The same in every market:

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `score`, `text`, `post`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

- `subject` (text): the address of the profile it is about, in the same market; the one field a
  check demands, since only it says who an entry is about.
- `score` (number): the rating, `"1"` to `"10"` with at most one decimal, such as `"8.5"`.
- `text` (text): what the writer says.
- `post` (text): the address of the post a review is about, `<profile address>/post/<id>`, whoever
  wrote it.

## Types

Every field is one of nine types, in [`types.json`](types.json). A program acts on a field by its
type, never its name, except for the [shared names](#shared-names).

| Type | A value | A program |
|---|---|---|
| `text` | text | searches it and shows it |
| `number` | decimal text, such as `"2.5"` | filters by range |
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
  place only `when` it is in person, as `mode` above.
- `money`: `currency` is a code such as `USD`; `per` is what the amount is for, one of its field's
  `per`, left out for the whole deal.
- `moment`: RFC 3339 with its zone, such as `2026-11-02T18:00:00+01:00`.
- `hours`: when a person is free each week. `zone` is a time zone name, such as `Europe/Madrid`;
  each slot's `days` are `monday` to `sunday`, and `from` and `to` are `HH:MM` in that zone.

Use `choice` for a topic people filter by, and `words` only for open tags.

## Photos

A photo is one of its entry's files. Give `post` a field of type `file`, `many` for more than one:

```json
"photos": { "type": "file", "description": "Photos of the item.", "many": true }
```

A post names each photo there by its SHA-256, and lists it in `files` as
[the standard names a file](https://github.com/foundationforest/standard/blob/main/folders/README.md#files):

```json
{
  "description": "A wool coat, worn twice.",
  "photos": ["04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86"],
  "files": [
    {
      "sha256": "04ea806c667cd600b86061122fb9a7192c76405d58e14d63d29c51825dc7ec86",
      "type": "image/jpeg",
      "size": 48213
    }
  ]
}
```

The app writes the post, then uploads the bytes to the folder's hosts, which keep them while a
current entry names them: a newer version that leaves a photo out lets it go, and a hash not in
`files` names nothing. A review holds files the same way.

## Shared names

These keep their meaning and type in every market, so a program finds them by name: the fields
every review, vouch and report holds, and three in `post`, none ever `many`:

- `description` (text): the post's main text, among any other text it holds. A market lists it.
- `price` (money): what the post costs, however it is paid, and the money a program sorts by. A
  market lists it where posts have a price.
- `contact` (text): how to reach the writer outside Forest, such as a phone, a handle or an
  email. Every post may hold it, and no market lists it. It is public to anyone, and the same
  contact on two profiles links them, so it is the person's choice per post.

## Propose

1. Write `markets/<name>.json`, or edit one as [Naming](#naming) allows.
2. Run `build/check.sh` (Node 22.18 or later, and npm), and fix what it prints. Once every market
   passes, it rewrites a stale `directory.json` or `directory.md` and fails, so run it again.
   Never edit either by hand.
3. Commit the market file and both directory files.
4. Open a pull request. The check runs again and must pass; then the Forest Foundation reviews and
   merges it.

## From a program

`build/` is a private npm package, `@foundationforest/markets`, linked from a markets checkout, not
from npm:

```json
"dependencies": { "@foundationforest/markets": "file:../markets/build" }
```

Run `npm ci && npm run build` in that `build/`, then:

```ts
import { loadMarkets } from '@foundationforest/markets'

const markets = loadMarkets() // the checkout the package is in; loadMarkets(dir) reads another
markets.directory // directory.json
markets.market('tutoring') // markets/tutoring.json
markets.checkEntry('tutoring', 'tutor', 'post', { subjects: ['knitting'] })
// 'subjects takes a list, each different, each one of maths, physics, …'
markets.checkEntry('clothing', 'seller', 'post', { kind: 'coat', footLength: '24.5' })
// 'footLength is only for a post whose kind is trainers, boots, sandals, heels, flats or slippers'
markets.checkEntry('home-repair', 'client', 'review', { subject, onTime: 'yes' }, 'repairer')
// null
```

A program reads the markets at the commit its checkout holds, and may read another directory's
checkout.

A page reads no files, and its content security policy may forbid `eval`. It imports
`@foundationforest/markets/browser` and gives it the same files as data: `directory.json`,
`build/types.json`, and the file of each market the directory lists. It throws when one of those is
missing.

```ts
import { loadMarkets } from '@foundationforest/markets/browser'

const markets = loadMarkets({ directory, types, markets: [clothing, electronics /* , … */] })
```

Both entries run the same code. It imports nothing, makes no code from strings, and reads
`build/types.json` as data, so a page and a program give every entry the same answer.

`checkEntry(market, role, kind, body, aboutRole?)` checks a post, a review, a vouch or a report by a
`role` profile as this manual says, and answers `null` when it fits, else the first field that does
not, in plain words. For a review, `aboutRole` is the role of the profile it is about: a field kept
for some roles is checked against it, and goes unchecked without it. It demands no field but the
`subject` of a review, a vouch or a report. Whether `subject`, or the profile in `post`, is an
address, and the body's `files`, are
[the standard's](https://github.com/foundationforest/standard/blob/main/folders/README.md) checks.

The package also exports `SHARED`, the fields each kind holds in every market beyond its market's,
as a market's fields are written: a post's `contact`, and what every review, vouch and report
holds. `previewOf(market)` gives the names of a market's post fields that matter first, most
needed first, as [Preview](#preview) says: its `preview`, or else `description`, `price`, then its
`place` fields, of those it has. `npm test` runs its tests; `npm run check` type-checks it, and the
browser entry again without Node's types.
