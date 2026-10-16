# Build a market

How to build a market, start to finish. This is the only place that teaches it.
[`market.schema.json`](market.schema.json) is the file's format, [`types.json`](types.json) its
types, and [`check.sh`](check.sh) checks both.

## Is it a market

Check [`directory.md`](../directory.md) first: the market may already be there.

Then take the dealing you have in mind and the nearest market there is, and ask three questions:

1. Would the offer look different?
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

## Roles

A market's roles are a list of `{ "role", "posts" }`, one role or several:

```json
"roles": [
  { "role": "teacher", "posts": "offers" },
  { "role": "student", "posts": "requests" }
]
```

- `role` is any word, spelled as a name is. A person holds one profile per role, and its label is
  `<market>/<role>`, with these words.
- `posts` says what the role's posts are: `offers` (what it gives), `requests` (what it looks for),
  or `posts` (neither: just posts). Every post is a record at `offer/<id>` in its profile's folder
  ([the standard's folders](https://github.com/foundationforest/standard/blob/main/records/README.md#folders));
  `posts` says how to read it.

## The file

One file per market, `markets/<name>.json`, with these seven keys and no others:

| Key | What it holds |
|---|---|
| `name` | The name ([Naming](#naming)). |
| `description` | What the dealing is, in one line. |
| `roles` | The roles ([Roles](#roles)). |
| `offer` | The fields of a post, by name, each a field as below. |
| `review` | `{ "shared", "fields" }`: the [shared](#shared-names) review fields a review here holds, by name, and any fields the market adds, written as the offer's are (`fields` is left out when there are none). |
| `payment` | The market's escrow schedules, by name ([Payment](#payment)). Direct payment is always allowed and is not listed. `{}` when there are none. |
| `howDealsGo` | How a deal here goes, in plain text. |

A field is `{ "type", "description" }`: one of the [types](#types), and what it holds, in one line.
It may add:

- `"values"`, for a `choice` and only for one: the list to choose from.
- `"many": true`: the field holds a list of its type, such as several photos. Never on `words`,
  which is a list already.
- `"required": true`: an app asks for it. Nothing enforces it.
- `"roles"`: the market's roles the field is for, one or more of its `role` words. In `offer`, only
  posts by those roles hold the field. In `review.fields`, only reviews of a profile in those roles
  hold it. Left out, the field is for every role.

```json
"offer": {
  "description": { "type": "text", "description": "What the session covers.", "required": true },
  "price": { "type": "money", "description": "The price of one session." },
  "levels": { "type": "choice", "description": "The levels taught.", "values": ["beginner", "advanced"], "many": true },
  "degrees": { "type": "text", "description": "Degrees or certificates the teacher holds.", "roles": ["teacher"] }
},
"review": {
  "shared": ["subject", "score", "text", "offer", "evidence"],
  "fields": {
    "prepared": { "type": "choice", "description": "Whether the teacher came prepared.", "values": ["yes", "no"], "roles": ["teacher"] }
  }
}
```

Only `subject` defines a review, so `review.shared` always holds it; everything else is optional.

A field's name is a key in a record, so it is a lowercase letter, then letters and digits, at most
64 characters: `startTime`, not `start-time`.

For `howDealsGo`, write how a deal in the market goes, never what an app does today: the sides
agree in messages; in a market with money, they pay direct or by one of its schedules; and each
review names the post.

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
| `money` | `{ "amount", "currency", "per" }` | prints it and pays it |
| `moment` | a time, or `{ "from", "to" }` | filters by time |
| `blob` | `{ "sha256", "mimeType", "size" }` | fetches it and shows it |
| `hours` | `{ "zone", "slots": [ { "days", "from", "to" } ] }` | filters by day and time |

- A record holds only whole numbers, so a number, an amount and a coordinate are decimal text.
- `place`: `lat` and `lon` in degrees, rounded to `precisionKm` kilometres, a whole number. `area` is
  the name people know the place by, such as a town. `"online": true` beside a point says the
  person deals there and online too. `reachKm`, a whole number, is how far from the point the
  person goes.
- `money`: `currency` is a code such as `USD`. `per` is what the amount is for, such as `hour`, and
  is left out when it is for the whole deal.
- `moment`: RFC 3339 with its zone, such as `2026-11-02T18:00:00+01:00`.
- `blob`: bytes on the folder's hosts, named as
  [the standard names a blob](https://github.com/foundationforest/standard/blob/main/records/README.md#blobs):
  their SHA-256 in lowercase hex, their media type, and how many bytes.
- `hours`: when a person is free, every week. `zone` is a time zone name, such as `Europe/Madrid`.
  Each slot's `days` are weekday names, `monday` to `sunday`, and its `from` and `to` are `HH:MM`
  in that zone, such as `"18:00"`.

Use `choice` for a topic people filter by, and `words` only for open tags.

## Shared names

A few names mean the same in every market, and keep their type, so a program finds them by name.

On posts, in `offer`:

- `description` (text, never `many`): the first text shown. An app shows a post by it, so it must
  know which text comes first.
- `price` (money, never `many`): the money to range and pay. A post may hold other money, so a
  program must know which one to sort by and to pay.
- `payment` (choice, always `many`): how the deal may be paid. Its `values` are `direct`, then the
  market's schedule names in the order `payment` lists them, and `check.sh` checks that they are.
  An app offers only these, so it must find them.

On reviews, in `review.shared`:

- `subject` (text): the address of the profile the review is about. An index counts the review for
  that profile.
- `score` (number): the rating, from `"1"` to `"10"` with at most one decimal, such as `"8.5"`. An
  index scores the profile by it.
- `text` (text): what the reviewer says. An app shows it beside the score.
- `offer` (text): the post's address, `<profile address>/offer/<id>`, whoever wrote it. An index
  ties the review to the post it is about.
- `evidence` (text): a receipt address or a payment signature. An index weighs the review by what
  backs it. No index on devnet reads it yet.

## Payment

There are two ways to pay, and every deal may pay direct. A market with no money has no evidence,
so its reviews are unbacked.

**Direct.** The payer sends a transfer with a memo naming the post. The transfer is the receipt,
and its signature is what a review's `evidence` holds.

**Escrow.** The payer puts the money in, and a schedule says how it can leave. Four moves:

1. **Generous, always.** The payer pays the recipient in full, or the recipient refunds the payer in
   full.
2. **Selfish, by the schedule.** In each window, the payer may take back alone the share that window
   gives.
3. **Stop,** by either side at any time before the schedule ends, freezes everything: then only
   both sides agreeing, or the arbiter, can close it. A generous move still can, as it always can.
4. **The end.** If nobody stops, the schedule ends with its default when its last window closes.

A market writes its schedules as templates of the
[schedule format](https://github.com/foundationforest/standard/blob/main/escrows/README.md), with
times relative to the deal:

```text
{
  "windows": [ { "from": "payment" | "dealStart" | "dealEnd", "offset": "+3d" | "-24h", "payerShare": 0 to 10000 } ],
  "end": "pay" | "refund",
  "arbiter": true | false
}
```

- `windows`, in order, at least one. The first opens when the money goes in, and each next one when
  the one before closes. A window closes at `offset`, hours (`h`) or days (`d`) after (`+`) or
  before (`-`) its `from`: `payment`, when the money went in, or `dealStart` or `dealEnd`, when the
  deal starts and ends, as the app sets them when it makes the escrow: from the post when it names
  a time, else as agreed in messages. When a post names a single time rather than a span, or the
  sides agree on one, `dealStart` equals `dealEnd`. Until the window closes, the payer may take back
  alone `payerShare` out of 10,000.
- `end`: what happens when the last window closes and nobody stopped: `pay`, everything to the
  recipient, or `refund`, everything back to the payer.
- `arbiter`: whether the deal names an arbiter, who may close a stopped escrow at any split. The two
  sides choose who, deal by deal.

The app turns each window into an absolute time, the `until` the escrow takes, from the deal's own
times.

Two schedules, as two markets might have written them. For things sent by post:

```json
"payment": {
  "shipped": {
    "windows": [ { "from": "payment", "offset": "+14d", "payerShare": 0 } ],
    "end": "pay",
    "arbiter": true
  }
}
```

The payer takes nothing back alone. Either side may stop within 14 days of paying, and then the
arbiter closes it; if nobody stops, it pays.

For a booked session:

```json
"payment": {
  "booked": {
    "windows": [
      { "from": "dealStart", "offset": "-24h", "payerShare": 10000 },
      { "from": "dealEnd", "offset": "+48h", "payerShare": 0 }
    ],
    "end": "pay",
    "arbiter": false
  }
}
```

Until 24 hours before the session starts, the payer may take it all back alone. From then until 48
hours after it ends, nothing alone. Then it pays, unless someone stopped.

**On devnet today**, the [escrow](https://github.com/foundationforest/standard/tree/main/escrows)
runs, though no app offers money screens yet. It takes one timer: a number of whole days after the
money is in, then everything to one side, unless either side
[objected](https://github.com/foundationforest/standard/blob/main/escrows/solana/README.md#the-arbiter-and-the-timer)
first. The objection is the stop, and an arbiter, if any, is named at the start. So a schedule runs
there when it has one window, from `payment`, with an offset of whole days and a `payerShare` of 0:
the app turns it into the timer, which pays the recipient for `pay` and the payer for `refund`. The
first example runs on devnet; the second does not. Several windows, a window from `dealStart` or
`dealEnd`, and a `payerShare` above 0 wait for the next escrow version, which is not written yet.
It is to take the absolute times: `windows`, each with its `until` and `payerShare`, and `end`.

## Propose

1. Write `markets/<name>.json`.
2. Run `build/check.sh` (Node 22 and npm). It checks each market file against the format and the
   types, and each name against its file's name. Once they all pass, it writes
   [`directory.json`](../directory.json) and [`directory.md`](../directory.md) from the market
   files, sorted by name. Fix what it prints until it passes. Nobody edits either directory file by
   hand.
3. Commit the market file and the directory files the check wrote.
4. Open a pull request. The check runs on it again, and must pass; then the Open Forest Foundation
   reviews it and merges it.
