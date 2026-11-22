# Pieces

The standard for what entries hold in every Forest market.

## The rule

- A market holds the stored form: one way to write each thing.
- Anything that can be worked out from it is a view, and belongs to the program that shows it.
- A view must be an exact conversion. Where it is not, store what the person said.

The test for anything an entry holds: would two apps need to agree on it to read each other's
listings? If not, it stays out. A market file also holds its own words, how to ask, its summary, its
icon and which fields come first, since no app knows a market by name.

A **rule** is checked, by [`check.sh`](check.sh) on a market file or by `checkEntry` on an entry,
which refuses one that breaks it. A **suggestion**, under a field's `ask`, says how to ask for it:
any program may ignore it, and it may change at any time, even in a live market.

## The pieces

An entry is a JSON object of answers, by field name, any of which may be left out. A field takes one
answer, or with `several` a list of one or more, each different. Answers in two fields never pair
up: Lisbon from 12 to 15 May and Porto from 16 to 19 May are two listings. Numbers, amounts, counts
and coordinates are decimal text, such as `"2.5"`; only `radiusKm` is a JSON number, whole.

`match` compares two answers of one field. An answer left out matches anything, and several match
when any pair does. How fields combine is each index's choice: one that hides a listing with no
answer checks for that itself.

**text**: the person's own words, never matched.

**choice**: one value from the field's `values`: its own list, or a shared list in
[`lists.json`](lists.json) by name, such as `languages` or `countries`, which only grows. Two choices
match when the same.

**number**: `"10"`, or a range, both ends included: `{ "from": "9", "to": "11" }`. An end left out
is no limit: `{ "from": "18" }` is 18 and over. A measure names its `unit`: `minutes`, `hours`,
`days`, `years`, `centimetres` or `square-metres`. Two numbers match when they overlap.

**price**: always a list of one or more, each `{ "amount", "currency", "per", "count", "note" }`.
`currency` is a code such as `EUR`; `per`, one of the field's `per`, or left out for the whole deal.
`count`, only with a `per`, is how many the amount buys, 1 when left out, and whole but per `hour`,
where it is a length: `{ "amount": "25", "currency": "EUR", "per": "hour", "count": "0.75" }` is 25
for 45 minutes. A `note` is the person's few words on that price, one line of at most 80 characters,
never matched, such as "at least 2 hours". In a request, a price is the most the writer would pay,
and one with a length also says how long the job is. Prices match when the offer's costs no more
than the request's, by amount divided by count, in the same currency and `per`; prices that cannot
be compared never block a match.

**place**: a circle, `{ "lat": "40.4342", "lon": "-3.7031", "radiusKm": 1 }`, in degrees and
kilometres. Radius 0 is an exact spot, set on a map; any other means "in or around here". A circle
written from memory is 1 km, centred on the neighbourhood the person names, whose name goes in the
`description`. An app placing one from where the person stands keeps them inside it, never at its
centre, which points to their door: it moves the centre by up to a tenth of the radius, the same way
each time for that profile, so listings cannot be averaged back to the spot. Radius 0, a public
spot, moves nothing. A place has no name, which has a language and can disagree with its
coordinates, and reads as its numbers. A whole country is a big circle. Two places match when their
circles touch.

**date**: days, and hours if wanted. Days are one day, `{ "on": "2026-11-24" }`; a span, both ends
included and either left out, `{ "from": "2027-06-01", "to": "2027-08-31" }`, so a deadline is
`{ "to": "2027-01-15" }`; or weekdays every week, `{ "every": ["monday", "thursday"] }`, `monday` to
`sunday`, with a `from` and a `to` if wanted. Hours are a `start`, or a `start` and an `end`, as
`HH:MM`, on each of those days; an end before the start runs past midnight. "Mornings" is not a
time, so a writer asks for the hours. Hours on any day are `every` with all seven days. An answer
with hours names its `zone` by IANA name, such as `Europe/Madrid`, never by offset; one without
hours has none.

```json
{ "every": ["saturday"], "from": "2027-05-01", "to": "2027-09-30", "start": "10:00", "zone": "Europe/Lisbon" }
{ "every": ["thursday"], "start": "09:00", "end": "12:00", "zone": "Europe/London" }
```

Weekly hours are several answers: Monday to Friday 9 to 17 and Saturday 10 to 14 are two. Clock
times at both ends of a span, taken slots, exceptions and "every two weeks" stay in words.

Two dates match when their real moments overlap, each read in its zone. A start alone is that
moment. With no hours, an answer is the whole day, in the zone of the answer it meets. Two weekly
answers compare in the week of a given day, today by default, since summer time moves one zone
against another. An app takes a date's zone from the listing's place when it has one: the hours are
where the deal is.

A listing's **spots** is how many places an offer has, or how many people a request is for: one
whole number, `"0"` when full. In a listing by a role spots is for, a date answer may hold its own,
which wins for that time:

```json
{ "on": "2026-11-28", "start": "10:00", "zone": "Europe/Lisbon", "spots": "3" }
```

Spots match when the offer's are at least the request's, and so do a date's own when both answers
hold some; a date with 0 matches nothing. `match` compares pair by pair, so weighing a time's own
spots over the listing's, or over another answer that covers the time, is each index's. Capacity has
one home, whatever the market, so a booking, once there is one, counts down one field.

**photo**: one of the entry's files, by the SHA-256 of its bytes in lowercase hex, listed in `files`
as [the standard names a file](https://github.com/foundationforest/standard/blob/main/folders/README.md#files).
**link**: a web address starting `https://` or `http://`. Neither is matched.

## The market file

`markets/<name>.json` holds these keys and no others:

| Key | Holds |
|---|---|
| `name` | The file's name: lowercase letters, digits and single hyphens, at most 64. |
| `summary` | What the dealing is: one line, at most 80 characters. |
| `description` | Optional: more, in one line. |
| `status` | `beta` or `live`. |
| `icon` | Optional: an icon in [`icons.json`](icons.json), no other market's. |
| `number` | A whole number from 1, no other market's. |
| `roles` | Each `{ "role", "listings" }`: a word spelled as a name is, and `offers` or `requests`. |
| `listing` | A listing's fields, by name. `description` is one text, `price` a price, `spots` one number with no unit. |
| `preview` | Optional: the listing fields that matter first, after `description`, which `ask` gives first: a listing has no title but its first line. |
| `review` | Optional: the fields a review here adds. |

A field's name is a lowercase letter, then letters and digits, at most 64. It is never `files`,
`contact`, or in a review `subject`, `listing`, `score` or `text`. The shortest field is
`{ "piece": "text" }`.

A field's **rules**:

- `piece`: one of the eight.
- `several: true`: a list of answers. Never on a price, which is always several.
- `roles`: the roles it is for, the writer's in a listing, the reviewed's in a review. Left out: all.
- `when`: it applies only when each choice field named holds one of the values listed, such as
  `{ "kind": ["socks"] }`. A field with several answers counts when any does. Never in a loop. An
  entry never holds a field that does not apply.
- `values` on a choice; `unit` on a measure; `per` on a price, what its amount may be for, such as
  `["hour", "day"]`. Never `visit`, `session` or `lesson`: only the seller knows how long one is, so
  a price per one compares with no price per hour.

Its **suggestions**, under `ask`, are checked only for being well formed:

- `label`: two or three words, for a value or a filter. Left out: the name in words.
- `question`, and a `hint`. Left out, the question is the label.
- `start`: where the input opens. A place's `radiusKm`; a date's `way` (`day`, `from-to`, `until` or
  `weekly`) and `hours: true`; a number's `range: true`.
- `as`: by role, its own `label`, `question`, `hint` and `start`, over the field's, a `start` key by
  key. In a review, the role is the one reviewed.
- `long: true`: text of several lines.
- `labels`: how a choice's values read in a sentence, lower case but for names, such as
  `{ "xl": "XL" }`.

## Reviews, vouches and reports

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `listing`, `score`, `text`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

Each must hold `subject`, the address of the profile it is about. `listing` is the deal's listing,
`<profile address>/listing/<id>`. `score` is a number from `"1"` to `"10"`, at most one decimal.
Every listing may hold `contact`, as text: how to reach the writer outside Forest. It is public, and
the same contact on two profiles links them. No market lists these.

## Status

A market starts as beta, and may change in any way. Once live, it never goes back, and only grows:
what was posted in it keeps fitting, and every profile stays what it is. `check.sh` fails on any
change to a market file against main that breaks this, though nothing yet checks the pieces. A live
market that must break becomes a new market, with a new name.

## From a program

`build/` is a private npm package, `@foundationforest/markets`. Link it from a markets checkout
(`"file:../markets/build"`) after `npm ci && npm run build` there. It imports nothing and makes no
code from strings.

```ts
import { labelOf, loadMarkets, valuesOf } from '@foundationforest/markets'

const markets = loadMarkets() // the checkout it sits in, or loadMarkets(dir)
markets.checkEntry('knitting', 'client', 'listing', body) // null, or why it does not fit
markets.match(field, a, b) // a is the offer's
markets.read(field, value) // "Monday to Friday, 9:00 to 17:00"
markets.ask('knitting', 'client') // the fields to ask, in order
valuesOf(field, markets.lists) // a choice's values
labelOf(field, 'es', markets.lists) // "Spanish"
```

`match` takes a field with its name, as `ask` gives it, since spots is known by name; without one,
it throws. `read` is a helper in English, not part of the standard: a program may word things its
own way. For a review, `checkEntry` and `ask` take the role reviewed last. `match` and `read` take
`{ today }`. A web page imports `@foundationforest/markets/browser` and passes the files:
`loadMarkets({ directory, lists, markets })`.
