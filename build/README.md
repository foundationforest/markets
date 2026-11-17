# Pieces

The standard for what entries hold in every Forest market, for the people and AIs who build markets
and the programs that read them. A **rule** here is checked, by [`check.sh`](check.sh) on each
market file or by `checkEntry` on each entry; anything else is advice, with its reason.

## Three layers

1. **Pieces**: the questions any listing can answer, and the ways to answer each, shared by every
   market.
2. **A market**: its roles and its fields. Each field is one piece with a name.
3. **Programs that meet a person**: an app, an index, an AI's connector. They read the first two and
   own their look.

If it is not written in an entry, a reader cannot see it, so it cannot be a rule. So a field holds
**rules**, what an entry must be, checked, and an entry that breaks one is refused; and
**suggestions**, under `ask`, how to ask for it, which no entry is checked against, any program may
ignore, and may change at any time, even in a live market. Nothing is written only for AIs: the
question a person reads in a form is what an AI reads.

## The pieces

An entry is a JSON object of answers, by field name. Any field may be left out, and a field one
side leaves out never blocks a match. A field takes one answer unless it says `several`: then a list
of one or more, each different, and two fields match when any pair of answers does. An entry holds
no fractions as JSON numbers, so numbers, amounts and coordinates are decimal text, such as `"2.5"`,
and only `radiusKm` and a price's `count` are plain whole numbers.

**text**: your own words, `"Merino jumpers, to your measure."`; with `several`, short words such as
`["merino", "alpaca"]`. Never matched: a program searches text its own way.

**choice**: one value from the field's `values`, its own list or a shared list in
[`lists.json`](lists.json) by name: `languages`, as ISO 639-1 codes such as `es`, or `countries`,
as ISO 3166-1 codes such as `PT`, plus `XK` for Kosovo, which ISO has given no code, so a place
there fits. A shared list only grows. Two choices match when they are the same.

**number**: `"10"`, or from one to another, both included, `{ "from": "9", "to": "11" }`, either end
left out for no limit, as `{ "from": "18" }` is 18 and over. A field names a `unit` only for a measure a program
could convert: `seconds`, `minutes`, `hours`, `days`, `years`, `centimetres`, `metres`,
`kilometres`, `square-metres`, `grams` or `kilograms`. A count names none, since its label says what
is counted: people, rooms, nights. Two numbers match when they overlap: 9 to 11 matches 10.

**price**: always a list of one or more, each `{ "amount", "currency", "per", "count" }`: `amount`
as decimal text, `currency` a code such as `EUR`, `per` one of the field's `per` or left out for the
whole deal, and `count`, only with a `per`, how many of it the amount buys, 1 when left out. So
`[{ "amount": "35", "currency": "EUR", "per": "item" }, { "amount": "90", "currency": "EUR", "per": "item", "count": 3 }]`
is 35 an item or 90 for three. In a request, it is the most the writer would pay. Prices compare by
amount divided by count, in one currency and `per`, since a rate between currencies is a guess: they
match when the offer's costs no more than the request's, and prices that cannot be compared never
block a match.

**place**: a circle, `{ "lat", "lon", "radiusKm", "name", "country" }`, all five, or a country
alone, `{ "country": "PT" }`, for anywhere in it. `lat` and `lon` are degrees, `radiusKm` whole
kilometres round the centre of the named place, `name` stands alone, such as a neighbourhood with
its town, and `country` is from the countries list. Radius 0 is an exact spot; any other means "in
or around here", not "inside this line". Two places match when their circles touch, and a country
matches the places in it. Where people also deal online, ask that as a choice before the place, and
ask the place only `when` it is in person: an online deal has no place, and one made up to fill a
form would hide it from people elsewhere.

```json
{ "lat": "40.4342", "lon": "-3.7031", "radiusKm": 1, "name": "Chamberí, Madrid", "country": "ES" }
```

**date**: days, and hours if wanted. Days are one day, `{ "on": "2026-11-24" }`; from one day to
another, both included, `{ "from": "2027-06-01", "to": "2027-08-31" }`, either end left out, so a
deadline is `{ "to": "2027-01-15" }`; or weekdays every week, `{ "every": ["monday", "thursday"] }`,
`monday` to `sunday`, with a `from` and a `to` if wanted. Hours are a `start`, or a `start` and an
`end`, as `HH:MM`, on each of those days, an end before the start running past midnight; or a `part`
of the day, `morning`, `afternoon` or `evening`. A part keeps the person's word and reads as it,
"Thursday mornings", since clock times made up for it would say hours they never gave; for matching
only, it counts as 6:00 to 12:00, 12:00 to 18:00 or 18:00 to 24:00. An answer with hours or a part
names its `zone` as the IANA time zone database does, such as `Europe/Madrid`, never by offset; one
without has none.

```json
{ "every": ["saturday"], "from": "2027-05-01", "to": "2027-09-30", "start": "10:00", "zone": "Europe/Lisbon" }
{ "every": ["thursday"], "part": "morning", "zone": "Europe/London" }
```

Weekly hours are several answers: Monday to Friday 9 to 17 and Saturday 10 to 14 are two. Clock
times at both ends of a span of days, taken slots, exceptions and "every two weeks" stay in words.
Two answers match when their real moments overlap: each becomes spans of real time through its zone.
A start alone is that moment; a part, its hours; with no hours, the whole day, in the zone of the
answer it meets. Two weekly answers are compared in the week of a given day, today by default, since
summer time moves one zone against another.

**photo**: one of the entry's files, by the SHA-256 of its bytes in lowercase hex, which the entry
lists in `files` as [the standard names a file](https://github.com/foundationforest/standard/blob/main/folders/README.md#files).
**link**: a web address starting `https://` or `http://`. Neither is matched.

## The market file

`markets/<name>.json` holds these keys and no others:

| Key | Holds |
|---|---|
| `name` | The file's name: lowercase letters, digits and single hyphens, at most 64. It is half of every label, `<market>/<role>`. |
| `summary` | What the dealing is, one line of at most 80 characters, since an app shows it where someone picks a market. |
| `description` | Optional: a few plain sentences more, in one line. |
| `status` | `beta` or `live` ([Status](#status)). |
| `icon` | Optional: one of the [Phosphor](https://phosphoricons.com) icons in [`icons.json`](icons.json), no other market's. |
| `number` | A whole number from 1 no other market holds, since apps tell markets apart by it. The name stays the only id. |
| `roles` | Each `{ "role", "listings" }`: a word, spelled as a name is, and whether its listings are `offers` or `requests`. |
| `listing` | A listing's fields, by name. |
| `preview` | Optional: the listing fields that matter first. Left out: `description`, `price`, then the places. |
| `review` | Optional: fields a review here adds, by name. |

A field's name is a lowercase letter, then letters and digits, at most 64 (`startTime`), never
`files`, which the standard keeps, nor a name every entry holds: `contact`, and in a review
`subject`, `listing`, `score` and `text`. In `listing`, `description` is one
text and `price` a price, so a program finds them by name.

A field's **rules**:

- `piece`: one of the eight.
- `several: true`: a list of answers. Never on a price, always several.
- `roles`: the roles it is for, in a listing by the writer, in a review by the profile reviewed.
  Left out: every role.
- `when`: it applies only when other choice fields of the same entry hold one of the values listed,
  such as `{ "kind": ["socks"] }`; with several named, all must, and a field with several answers
  counts when any does. Never in a loop, so a form can ask each field after those it depends on.
  An entry never holds a field that does not apply.
- `values`, on a choice; `unit`, on a number that measures; and `per`, on a price, what its amount
  may be for, such as `["hour", "lesson"]`, else always the whole deal.

Let two roles share a field only when they answer the same question, so that sharing an answer means
a deal. Where one says what they can do and the other what they have, give each its own field: their
answers differ even when the deal is good, and one field would read that as no match.

Its **suggestions**, under `ask`, each with a fallback:

- `label`: two or three words, for showing a value and for a filter. Left out: the name in words,
  as `footLength` reads "Foot length".
- `question`, and a `hint` if needed. Left out: the label.
- `start`, where the input opens, and so the answer when the person gives no other: a place's
  `radiusKm`, a date's `way` (`day`, `from-to`, `until` or `weekly`) and `hours`, `true` for clock
  times or `"part"` for a part of the day, a number's `range: true`. Left out: a 5 km circle, one day
  with no hours, one number.
- `as`: by role, its own `label`, `question`, `hint` and `start`, each over the field's. A role's
  `start` merges over the field's key by key, as the field's does over the piece's own, so
  `{ "hours": "part" }` keeps the field's `way`. In a review, a role names the one reviewed.
- `usual`, a number's usual span; `long: true`, text of several lines; `labels`, how a choice's
  values read, such as `{ "xl": "XL" }`. Left out, a value reads as its shared list says, or as
  itself with a capital and hyphens as spaces.

`check.sh` checks suggestions only for being well formed. The shortest field is its piece:

```json
"area": {
  "piece": "place",
  "ask": {
    "label": "Area",
    "as": {
      "cleaner": { "question": "Where do you work?", "start": { "radiusKm": 10 } },
      "client": { "question": "Where is your home?", "start": { "radiusKm": 1 } }
    }
  }
}
```

## Reviews, vouches and reports

| Kind | At | Says | Fields |
|---|---|---|---|
| review | `review/<id>` | how a deal with the profile went | `subject`, `listing`, `score`, `text`, and the market's `review` fields |
| vouch | `vouch/<id>` | "I know this profile is real and honest." | `subject`, `text` |
| report | `report/<id>` | "This profile is fake or a scam." | `subject`, `text` |

`subject`, the address of the profile it is about, is the one field each must hold, since only it
says who one is about. `listing` is the address of the deal's listing, `<profile address>/listing/<id>`;
`score`, one number from `"1"` to `"10"` with at most one decimal; `text`, the writer's words. Every
listing may hold `contact`, text: how to reach the writer outside Forest, public, and the same on two
profiles links them. No market lists these.

## Status

A beta market may change in any way. A live market only grows, on its rules, so whatever was
posted in it keeps fitting and every profile stays what it is: it may add roles, fields, values and
`per` values, and widen `roles` or `when`, but never drop or rename itself, a role, a field or a
value, change its number, a role's `listings` or a field's piece, `several` or `unit`, or narrow
`roles` or `when`. Everything else may change. A market starts as beta and never goes back from
live; `check.sh` fails on any break against main, so one that must break becomes a new market, with
a new name.

## Notes for apps

- Centre a home's circle on its named place, never sized by where the person is: a circle drawn
  around them points to their door.
- An exact spot is for a public place, meant to be found, such as a court.
- Take the zone from the listing's place when it has one: the hours are where the deal is.
- Store what the person said, and convert only when showing: a conversion is a guess, and stored, it
  replaces their words.
- An index may rank a match higher the more answers two listings share, since one shared answer is
  only the floor: socks and hats wanted match a knitter of socks alone, and one who knits both fits
  better.

## From a program

`build/` is a private npm package, `@foundationforest/markets`, linked from a markets checkout
(`"file:../markets/build"`) after `npm ci && npm run build` there. It imports nothing and makes no
code from strings, and answers four questions, so an app, an index and a connector cannot disagree:

```ts
import { loadMarkets } from '@foundationforest/markets'

const markets = loadMarkets() // the checkout it sits in, or loadMarkets(dir)
markets.checkEntry('knitting', 'client', 'listing', body) // 1. null when it fits, else why not
markets.match(field, a, b) // 2. for a price, a is the offer's
markets.read(field, value) // 3. "Monday to Friday, 9:00 to 17:00"
markets.ask('knitting', 'client') // 4. its fields in order: piece, rules and words
```

For a review, `checkEntry` and `ask` take the role reviewed last. `match` and `read` take
`{ today }`; `read` leaves the zone out, for a program to show when the reader is in another. A page
imports `@foundationforest/markets/browser` and passes the files as data, `loadMarkets({ directory,
lists, markets })`. `npm test` runs the tests, on [`test/knitting.json`](test/knitting.json), a
market that holds every key.
