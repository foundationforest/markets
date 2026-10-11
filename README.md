# markets

Part of [Forest](https://github.com/foundationforest). This is the open list of markets: a
recommended name for each kind of dealing, with a file of suggestions for what offers, reviews and
deals there usually look like. Apps and indexes read these files so that a tutor profile means the
same thing in every app and index that uses them. Nothing here is required: any name is a market;
this list is the one we recommend, and anyone can grow it. The list is
[`directory.md`](directory.md).

## What a market is

A market is a name. On Forest, a profile lives in one market, on one side of it, and a profile's
label is `name/role`, such as `plumbing/seller`, `stays/buyer` or `tennis/peer`. The
[registry](https://github.com/foundationforest/standard/tree/main/registry) allows one line per
verified human per label, per issuer. A label is free text and the registry accepts any, so anyone
can start a market just by using a name.

This repo adds two things to a name:

1. **A recommended spelling**, so one trade doesn't split into several names: `plumbing`, and not
   also `plumber` and `plumbers`.
2. **A file of suggestions** at `<folder>/<name>.json`:
   - `description`: what the market is, in one line.
   - `sides`: `two` (a seller and a buyer) or `one` (peers, like tennis partners). The roles come
     from it: `seller` and `buyer`, or `peer`.
   - `roleNames`: plainer words for the two sides, when there are better ones: host and guest,
     teacher and student.
   - `offerFields`: fields an offer here usually carries, such as a plumber's arrival window.
   - `reviewFields`: extra fields a review here may carry.
   - `ratings`: the rating names reviews here usually use. `overall` is always one; plumbing adds
     `punctuality`, stays adds `location` and `cleanliness`.
   - `evidenceTypes`: what can show a deal here happened. `escrow` is the one defined so far.
   - `howDealsGo`: how deals here usually go, in plain words: what done looks like, which escrow
     options people tend to turn on and why, what to check before paying.
   - `folder`: where the file sits. Folders are only for finding markets. No label contains one, so
     they can be reorganized any time.

`home/plumbing.json`:

```json
{
  "name": "plumbing",
  "folder": "home",
  "description": "Pipes, taps, drains, toilets and water heaters: fixing and fitting.",
  "sides": "two",
  "evidenceTypes": ["escrow"],
  "offerFields": {
    "properties": {
      "appointmentWindowHours": {
        "type": "integer",
        "description": "How wide the arrival window is, in hours: the seller arrives within this many hours of the booked time.",
        "minimum": 0
      }
    }
  },
  "reviewFields": {},
  "ratings": ["overall", "punctuality"],
  "howDealsGo": "The buyer books a visit and pays into escrow. Done is the job working when the plumber leaves, and the buyer releases then. A timer to the seller, set past the visit, pays for work done if the buyer goes quiet. Before paying, agree whether parts are in the price."
}
```

## Every field is a suggestion

Every field in a market file is a suggestion to indexes and apps, never a rule, and nothing here
allows, forbids or approves a market or a deal. Even `sides` only suggests: whether a market counts
as one-sided or two-sided for reviews is each index's choice.

- No field is required. An offer may leave out any field its market suggests, and carry others.
- A review may use rating names its market doesn't list.
- Evidence weighs; it never rejects. A review with no evidence under it is still a review, and an
  index weighs it less.
- Role names are words for pages. Labels and offers still say `seller` and `buyer`.
- No file sets a price, a deadline, or any amount of money or time. The people in a deal set those,
  offer by offer.
- A name that isn't in this directory is still a market. It just isn't one the directory
  recommends.

## How indexes and apps use this directory

Everything here is public and released under CC0: anyone may copy it, change it or build on it,
with no permission needed.

**Indexes** decide which markets they show and which profiles they count. The Open Forest
Foundation's index counts a profile only when its label uses a name listed here, byte for byte, and
a role its sides allow; a market missing from `directory.md` has no counted profiles there, though
nothing here forbids it. How it reads this repo, and how often, is in
[services/index](https://github.com/foundationforest/services/tree/main/index). Another index may
read this list differently, or not at all.

**Apps** can use the same files: offer fields to build an offer form, ratings to suggest what a
reviewer rates, role names and how deals go for their pages, and `schema/market.json` to check a
file before using it.

**A fixed version.** `main` changes as markets are added. To read a version that never moves, read
a commit: `https://raw.githubusercontent.com/foundationforest/markets/<commit>/directory.md`.

## Propose a market

Anyone may. Add `<folder>/<name>.json` and its line in `directory.md`, run `./check.sh`, and open a
pull request. Every pull request runs `check.sh` again, and it must pass. Then the foundation
reviews the pull request and merges it. Step by step, with every key explained:
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## The format and the check

- [`schema/market.json`](schema/market.json) is the market file's format, a JSON Schema (draft
  2020-12).
- The field definitions inside `offerFields` and `reviewFields` still use AT Protocol lexicon field
  syntax: `type`, `description`, `maxLength`, `knownValues`, `format` and so on. Forest's own
  records now use JSON Schema. Moving market fields to JSON Schema too is the first item of the
  Markets phase; until then they keep their current syntax.
- `./check.sh` checks every market file. It needs Node 22 and npm, and installs its one
  dependency, the ajv validator, at the version locked in `package-lock.json`, on its first run.
  It checks:
  1. each file against the schema;
  2. that each file sits at `<folder>/<name>.json`;
  3. that no two files share a name;
  4. that every file has its line in `directory.md`, and every line there points at a market file
     of the name it lists.

  It prints what fails and exits 1, or exits 0 when everything passes. A GitHub Actions workflow,
  `.github/workflows/check.yml`, runs it on every pull request.

## What's here

| Path | What it is |
|---|---|
| `<folder>/<name>.json` | One market each |
| [`directory.md`](directory.md) | The list: every market, by folder, with one line each |
| [`schema/market.json`](schema/market.json) | The market file's format |
| `check.sh`, `package.json`, `package-lock.json` | The check, and the validator it uses |
| `.github/workflows/check.yml` | Runs the check on every pull request |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to propose a market or a change to one |
| [`CLAUDE.md`](CLAUDE.md) | Rules for AI sessions working here |
| [`LICENSE`](LICENSE) | CC0 1.0 |
