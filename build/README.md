# Build a market

How to write a market file and propose it. [`market.schema.json`](market.schema.json) is its
format, and [`types.json`](types.json) its types.

## Is it a market

A person holds one profile per market and role, and nothing public links them, so a reputation in
one market counts in another only if the person shows it there, with a reputation proof. Keep a
market as narrow as the dealing people look for, never wider to pool reputation.

First check [`directory.md`](../directory.md): the market may be there. If not, take the nearest
one and ask:

1. Would the post look different?
2. Would a good one be praised for different things?
3. Would a person want the two kept from each other?

Any yes: it is a new market. All no: it is the same market, and your topic is a field. A review
names its post, so an index can still tell plumbing from painting.

## Naming

A name says what the dealing is, in the words people use: usually two words, such as
`home-repair`, sometimes one, such as `tutoring`. Add the second word when the first could mean
another dealing. A topic is never in a name; it is a field. A name is lowercase letters, digits and
single hyphens, at most 64 characters, and no other market's.

Once a market is merged, its name and its roles' words never change, since they are part of every
profile's key. Fields can be added; none is removed or retyped.

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

## The file

`markets/<name>.json` holds these keys and no others:

| Key | What it holds |
|---|---|
| `name` | The name, the same as the file's ([Naming](#naming)). |
| `description` | What the dealing is, in one line. |
| `roles` | One role or several ([Roles](#roles)). |
| `post` | The fields of a post, by name. |
| `preview` | Optional: the `post` fields a preview shows first ([below](#preview)). |
| `review` | Optional: fields a review here holds besides [the shared ones](#reviews-vouches-and-reports), by name. |

A field is `{ "type", "description" }`: one of the [types](#types), and what it holds, in one line.
It may add:

- `"values"`, for a `choice` and only for one: the list to choose from.
- `"many": true`: a list of its type, such as several photos. Never on `words`, a list already.
- `"required": true`: an app asks for it. Nothing enforces it.
- `"roles"`: the roles the field is for. In `post`, only their posts hold it; in `review`, only
  reviews of a profile in them. Left out: every role.

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

A field's name is a key in an entry's body: a lowercase letter, then letters and digits, at most 64
characters (`startTime`, not `start-time`). It is never `files`, which the standard keeps for an
entry's files ([Photos](#photos)), and in `review` never a shared name.

### Preview

`preview` lists the `post` fields that tell one post from another, most needed first, such as in a
search result or a spoken summary; a post's preview holds those it has. It names content, never a
screen shape. Left out, it is `description`, `price`, then the first `place` field, of those the
market has. Write it only where that is wrong, such as with no price, or where photos or a topic
matter first, like `levels` above.

## Reviews, vouches and reports

The same in every market:

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `score`, `text`, `post`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

- `subject` (text, required): the address of the profile it is about, in the same market; the one
  required field a check enforces, since only it says who an entry is about.
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
| `place` | `{ "lat", "lon", "precisionKm", "area" }`, with `"online": true` and `"reachKm"` if wanted, or `{ "online": true }` | finds what is near |
| `money` | `{ "amount", "currency", "per" }` | prints it and sorts by it |
| `moment` | a time, or `{ "from", "to" }` | filters by time |
| `file` | the SHA-256 of one of the entry's `files`, in lowercase hex ([Photos](#photos)) | fetches it and shows it |
| `hours` | `{ "zone", "slots": [ { "days", "from", "to" } ] }` | filters by day and time |

- Numbers, amounts and coordinates are decimal text, since an entry holds only whole numbers.
- `place`: `lat` and `lon` in degrees, rounded to `precisionKm`, a whole number of kilometres;
  `area` is the name people know it by, such as a town; `"online": true` beside a point means
  online too; `reachKm`, a whole number, is how far from it the person goes.
- `money`: `currency` is a code such as `USD`; `per` is what the amount is for, such as `hour`,
  left out for the whole deal.
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
every review, vouch and report holds, and two in `post`, neither ever `many`:

- `description` (text): the post's main text, among any other text it holds.
- `price` (money): what the post costs, the money a program sorts by.

## Payments

No market says yet how its deals are paid; `price` is what something costs, however it is paid.
With the standard's [escrow](https://github.com/foundationforest/standard/blob/main/escrows/README.md),
markets will name their schedules and how a review shows what backs it.

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
markets.checkEntry('home-repair', 'client', 'review', { subject, onTime: 'yes' }, 'repairer')
// null
```

A program reads the markets at the commit its checkout holds, and may read another directory's
checkout.

`checkEntry(market, role, kind, body, aboutRole?)` checks a post, a review, a vouch or a report by a
`role` profile as this manual says, and answers `null` when it fits, else the first field that does
not, in plain words. For a review, `aboutRole` is the role of the profile it is about: a field kept
for some roles is checked against it, and goes unchecked without it. It enforces no `required` but
`subject`. Whether `subject`, or the profile in `post`, is an address, and the body's `files`, are
[the standard's](https://github.com/foundationforest/standard/blob/main/folders/README.md) checks.

The package also exports `SHARED`, the fields every review, vouch and report holds, as a market's
fields are written. `npm test` runs its tests; `npm run check` type-checks it.
