# Build a market

How to build a market, start to finish. This is the only place that teaches it.
[`market.schema.json`](market.schema.json) is the file's format, [`types.json`](types.json) its
types, and [`check.sh`](check.sh) checks both. This directory is also the package a program imports
to read the markets and check an entry ([From a program](#from-a-program)).

## Is it a market

Check [`directory.md`](../directory.md) first: the market may already be there.

Then take the dealing you have in mind and the nearest market there is, and ask three questions:

1. Would the post look different?
2. Would a good one be praised for different things?
3. Would a person want the two kept from each other?

Any yes: it is a new market. All no: it is the same market, and your topic is a field.

## Naming

A name says what the dealing is, in the words people use, so the list alone tells you what it is.
Usually two words, sometimes one. Add the second word when the first could mean another dealing. A
topic is never in a name; it is a field.

From the directory: `tennis-matches`, `sports-coaching`, `home-cleaning`, `home-repair`, `tutoring`,
`software-development`, `electronics`, `clothing`.

Spelling: lowercase letters, digits and single hyphens, at most 64 characters, no other market's
name.

Once a market is merged, its name and its roles' words never change, since they are part of every
profile's key; fields can be added, none is removed or retyped.

## Roles

A market's roles are a list of `{ "role", "posts" }`, one role or several:

```json
"roles": [
  { "role": "tutor", "posts": "offers" },
  { "role": "student", "posts": "requests" }
]
```

- `role` is any word, spelled as a name is. A person holds one profile per role, and its label is
  `<market>/<role>`, with these words.
- `posts` says how to read the role's posts: `offers` (what it gives), `requests` (what it looks
  for), or `posts` (neither: just posts). Every post is an entry at `post/<id>` in its profile's
  [folder](https://github.com/foundationforest/standard/blob/main/folders/README.md#folders),
  whatever its role's `posts` says.

## The file

One file per market, `markets/<name>.json`, with these six keys and no others; `preview` and
`review` may be left out:

| Key | What it holds |
|---|---|
| `name` | The name ([Naming](#naming)). |
| `description` | What the dealing is, in one line. |
| `roles` | The roles ([Roles](#roles)). |
| `post` | The fields of a post, by name, each a field as below. |
| `preview` | The `post` fields a post's preview shows first, in order, such as in a search result, a short list or a spoken summary. Left out, they are `description`, `price`, then the first field of type `place`, of those the market has. |
| `review` | The fields a review here holds besides the ones every review holds ([Reviews, vouches and reports](#reviews-vouches-and-reports)), by name, each a field as below. Left out when there are none. |

A field is `{ "type", "description" }`: one of the [types](#types), and what it holds, in one line.
It may add:

- `"values"`, for a `choice` and only for one: the list to choose from.
- `"many": true`: the field holds a list of its type, such as several photos. Never on `words`,
  which is a list already.
- `"required": true`: an app asks for it. Nothing enforces it.
- `"roles"`: the market's roles the field is for, one or more of its `role` words. In `post`, only
  posts by those roles hold the field. In `review`, only reviews of a profile in those roles hold
  it. Left out, the field is for every role.

```json
"post": {
  "description": { "type": "text", "description": "What the session covers.", "required": true },
  "price": { "type": "money", "description": "The price of one session." },
  "levels": { "type": "choice", "description": "The levels taught.", "values": ["beginner", "advanced"], "many": true },
  "degrees": { "type": "text", "description": "Degrees or certificates the tutor holds.", "roles": ["tutor"] }
},
"preview": ["levels", "description", "price"],
"review": {
  "prepared": { "type": "choice", "description": "Whether the tutor came prepared.", "values": ["yes", "no"], "roles": ["tutor"] }
}
```

A field's name is a key in an entry's body, so it is a lowercase letter, then letters and digits,
at most 64 characters: `startTime`, not `start-time`. It is never `files`, which the standard keeps
for the files an entry names ([Photos](#photos)), and a `review` field is never one of the fields
every review holds.

For `preview`, list what a person needs first to tell one post from another, most needed first.
Each name is one of the market's `post` fields, and `check.sh` checks that it is; a post's preview
holds those of them the post has. It names content, never a screen shape. Write it only where the
default is wrong, such as in a market with no price, or one where photos or a topic matter first,
like the levels above.

## Reviews, vouches and reports

Three kinds say something about a profile. Each holds the same fields in every market, defined here
once:

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `score`, `text`, `post`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

- `subject` (text, required): the address of the profile the entry is about, in the same market.
  It is the one required field a check enforces, since only it says who an entry is about.
- `score` (number): the rating, from `"1"` to `"10"` with at most one decimal, such as `"8.5"`.
- `text` (text): what the writer says.
- `post` (text): the address of the post the review is about, `<profile address>/post/<id>`,
  whoever wrote it.

A market adds fields to its reviews only, in `review`; a vouch and a report hold nothing else.

## Types

Every field is one of nine types, defined in [`types.json`](types.json). A program acts on a field
by its type, never by its name, except for the [shared names](#shared-names).

| Type | A value | A program |
|---|---|---|
| `text` | text | searches it and shows it |
| `number` | decimal text, such as `"2.5"` | filters by range |
| `words` | a list of short words | filters by them |
| `choice` | one of the field's `values` | filters by it |
| `place` | `{ "lat", "lon", "precisionKm", "area" }`, with `"online": true` and `"reachKm"` if wanted, or `{ "online": true }` | finds what is near |
| `money` | `{ "amount", "currency", "per" }` | prints it and sorts by it |
| `moment` | a time, or `{ "from", "to" }` | filters by time |
| `file` | the SHA-256 of one of the entry's `files`, in lowercase hex | fetches it and shows it |
| `hours` | `{ "zone", "slots": [ { "days", "from", "to" } ] }` | filters by day and time |

- An entry holds only whole numbers, so a number, an amount and a coordinate are decimal text.
- `place`: `lat` and `lon` in degrees, rounded to `precisionKm` kilometres, a whole number. `area` is
  the name people know the place by, such as a town. `"online": true` beside a point says the
  person deals there and online too. `reachKm`, a whole number, is how far from the point the
  person goes.
- `money`: `currency` is a code such as `USD`. `per` is what the amount is for, such as `hour`, and
  is left out when it is for the whole deal.
- `moment`: RFC 3339 with its zone, such as `2026-11-02T18:00:00+01:00`.
- `file`: one of the files its entry names, by the SHA-256 of its bytes in lowercase hex. The entry
  lists that file in `files`, as
  [the standard names a file](https://github.com/foundationforest/standard/blob/main/folders/README.md#files):
  `{ "sha256", "type", "size" }`, its SHA-256, its media type and how many bytes.
- `hours`: when a person is free, every week. `zone` is a time zone name, such as `Europe/Madrid`.
  Each slot's `days` are weekday names, `monday` to `sunday`, and its `from` and `to` are `HH:MM`
  in that zone, such as `"18:00"`.

Use `choice` for a topic people filter by, and `words` only for open tags.

## Photos

A photo is one of the files of the entry it is on. To let a post show photos, give `post` a field
of type `file`, with `many` for more than one:

```json
"photos": { "type": "file", "description": "Photos of the item.", "many": true }
```

A post with photos names each one in that field, and lists each in its body's `files`:

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

The app writes the post, then uploads each photo's bytes to the folder's hosts. The hosts keep the
bytes while a current entry names them, so a newer version of the post that leaves a photo out lets
it go. A hash the post does not list in `files` names nothing a host keeps. A review holds files the
same way. How bytes are uploaded and fetched is
[the standard's](https://github.com/foundationforest/standard/blob/main/folders/README.md#files).

## Shared names

A few names mean the same in every market, and keep their type, so a program finds them by name:
the fields every review, vouch and report holds ([Reviews, vouches and
reports](#reviews-vouches-and-reports)), and two on posts, in `post`:

- `description` (text, never `many`): the post's main text. A post may hold other text, so a
  program must know which is the main one.
- `price` (money, never `many`): what the post costs. A post may hold other money, so a program
  must know which one to sort by.

## Payments

No app handles payments yet, so no market says how its deals are paid; `price` says what something
costs, however it is paid. Payments come later, through the standard's
[escrow](https://github.com/foundationforest/standard/blob/main/escrows/README.md), and markets will
then name their schedules and how a review shows what backs it.

## Propose

1. Write `markets/<name>.json`.
2. Run `build/check.sh` (Node 22.18 or later, and npm). It checks each market file against the
   format and the types, and each name against its file's name. Once they all pass, it writes
   [`directory.json`](../directory.json) and [`directory.md`](../directory.md) from the market
   files, sorted by name. Fix what it prints until it passes. Nobody edits either directory file by
   hand.
3. Commit the market file and the directory files the check wrote.
4. Open a pull request. The check runs on it again, and must pass; then the Open Forest Foundation
   reviews it and merges it.

## From a program

This directory is an npm package, `@foundationforest/markets`, private like the standard's
packages, so a program links it from a markets checkout, not from npm:

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
markets.checkEntry('home-repair', 'client', 'review', { subject, onTime: 'yes' }, 'repairer')
// null
```

`checkEntry(market, role, kind, body, aboutRole?)` checks a post, a review, a vouch or a report
written by a `role` profile against its market, as this manual says: each field is one its market
names for that kind and role, of its type, a choice among its values, `many` a list of distinct
values, a `file` the SHA-256 of one of the body's `files`, and a review's `score` and `post` as
[defined](#reviews-vouches-and-reports). For a review, `aboutRole` is the role of the profile it is
about: a field kept for some roles is checked against it, and not checked without it. It answers
`null` when the body fits, else the first field that does not, in plain words. `required` is not
enforced, except `subject`. Whether `subject`, or the profile in `post`, is an address, and the
body's `files` itself, are
[the standard's](https://github.com/foundationforest/standard/blob/main/folders/README.md) checks.

The package also exports `SHARED`, the fields every review, vouch and report holds, written as a
market's fields are. Here, `npm test` runs its tests and `npm run check` type-checks it.
