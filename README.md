# markets

The Forest Foundation's directory of markets: recommended market names, each with a file of
suggestions for what dealing there usually looks like. The list is [`directory.md`](directory.md).

## What a market is

A market is a label. On Forest, a profile lives in one market, on one side of it, and its badge is
one line on the registry under a label: one verified human per line, and at most one line per
human per label. The recommended label is `market/role`, such as `plumbing/seller`, `stays/buyer`
or `tennis/peer`. A label is free text and the registry accepts any, so anyone can start a market
just by using a name.

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

Nothing here allows, forbids or approves a market or a deal.

- No field is required. An offer may leave out any field its market suggests, and carry others.
- A review may use rating names its market doesn't list.
- Evidence weighs; it never rejects. A review with no evidence under it is still a review, and an
  index weighs it less.
- Role names are words for pages. Badges and offers still say `seller` and `buyer`.
- No file sets a price, a deadline, or any amount of money or time. The people in a deal set those,
  offer by offer.
- A name that isn't in this directory is still a market. It just isn't one the directory
  recommends.

## How indexes and apps use this directory

Everything here is public and released under CC0: anyone may copy it, change it or build on it,
with no permission needed.

**Indexes** decide which markets they show and which badges they count. The foundation's index, in
[foundationforest/services](https://github.com/foundationforest/services), reads this repo over
HTTPS when it starts, from `main` or a commit it is pinned to:

1. It reads `directory.md` and takes each line shaped ``- [`name`](folder/name.json): ...``.
   Nothing else on the page.
2. It fetches each file those lines link, and refuses one whose `name` and `folder` don't match its
   path, or that lacks what it reads.
3. It counts a badge only under `market/role`, with the market a name listed here, byte for byte,
   and the role one the market's sides allow. A badge under any other label counts for nothing
   there.
4. Its pages show each market's description and how deals go, call the two sides by their role
   names, and show the review fields a market names.

So for the foundation's index, a market missing from `directory.md` has no counted badges, even
though nothing here forbids it. Another index may read this directory differently, or not at all.

**Apps** can use the same files: offer fields to build an offer form, ratings to suggest what a
reviewer rates, role names and how deals go for their pages, and `schema/market.json` to check a
file before using it.

**A fixed version.** `main` changes as markets are added. To read a version that never moves, read
a commit: `https://raw.githubusercontent.com/foundationforest/markets/<commit>/directory.md`.

## Propose a market

Anyone may. Add `<folder>/<name>.json` and its line in `directory.md`, run `./check.sh`, and open a
pull request. Every pull request runs `check.sh` again, and is merged when it passes; nothing else
is judged. Step by step, with every key explained: [`CONTRIBUTING.md`](CONTRIBUTING.md).

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
- `.github/workflows/auto-merge.yml` turns on GitHub's auto-merge for a pull request that only adds
  or changes market files and their lines in `directory.md`, and drops no name listed there. GitHub
  merges it once the check passes. A pull request that changes anything else waits for a person,
  since it could change the check itself.

## What's here

| Path | What it is |
|---|---|
| `<folder>/<name>.json` | One market each |
| [`directory.md`](directory.md) | The list: every market, by folder, with one line each |
| [`schema/market.json`](schema/market.json) | The market file's format |
| `check.sh`, `package.json`, `package-lock.json` | The check, and the validator it uses |
| `.github/workflows/check.yml` | Runs the check on every pull request |
| `.github/workflows/auto-merge.yml` | Merges a pull request that only changes markets, once the check passes |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to propose a market or a change to one |
| [`CLAUDE.md`](CLAUDE.md) | Rules for AI sessions working here |
| [`LICENSE`](LICENSE) | CC0 1.0 |
