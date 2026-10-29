# markets

Part of [Forest](https://github.com/foundationforest). The shared standard for what people post and review.

[The standard](https://github.com/foundationforest/standard) defines how profiles, proofs, folders and escrows work, and names no fields of an offer or a review. Every market's shape lives here, in one file per market, so any trade can exist without building a new platform for it. Public domain ([CC0](LICENSE)).

## What a market is

A market is a trade or space people hold a profile in, one profile per role, labelled `<market>/<role>`, such as `tutoring/tutor`, `electronics/seller`, or `tennis-matches/player`.

One file in [`markets/`](markets/) defines everything an app, an AI or an index needs to work in that market:
- **Roles:** which sides exist in the market, and whether each role publishes offers, requests, or posts.
- **Offer shape:** the typed fields of a post, written at `offer/<id>` in a profile's [folder](https://github.com/foundationforest/standard/blob/main/folders/README.md#folders).
- **Review shape:** the typed fields of a review, written at `review/<id>` in a profile's folder.
- **Vouch and report shapes:** the fields of a vouch, written at `vouch/<id>`, and of a report, written at `report/<id>`, in a profile's folder.
- **Payment schedules and how deals go:** how a deal moves from agreement to completion, including standard [escrow](https://github.com/foundationforest/standard/blob/main/escrows/README.md) schedule templates when money is locked in advance.

`offer/<id>`, `review/<id>`, `vouch/<id>` and `report/<id>` are the four kinds a market defines, and this repo keeps them, not the standard. The standard holds formats, recipes and checks, and names no content path; what an entry is for is a meaning, and meanings are the market's.

## Why markets are narrow

A person holds one profile per market and role, and nothing public links their profiles. A review, a vouch or a report is about a profile in the same market as its writer. A reputation earned as `tennis-matches/player` says nothing about them as `tutoring/tutor` unless they choose to show it, with a reputation proof: a score carried from hidden profiles onto a new one, without naming them. So a market is as narrow as the dealing people look for, and never widened to pool reputation; pooling is the person's choice, deal by deal. Reviews name the post they are about, so inside one market an index can still tell plumbing work from painting.

## Reviews, vouches and reports

Three kinds say something about a profile, each naming it as its `subject`:

- **A review** says how a deal with the profile went, and may hold a score from 1 to 10: a rating.
- **A vouch** says: "I know this profile is real and honest."
- **A report** says: "This profile is fake or a scam."

A vouch and a report may add text, saying why. A rating may count as a vouch too; an index decides how a rating counts.

A review's evidence is optional today; an index may later count a review backed by a deal, such as a payment or a meeting, for more.

## How it works

1. **Propose.** Anyone can propose a new market or improve an existing one by adding or editing a file in [`markets/`](markets/) (see [`build/README.md`](build/README.md)).
2. **Check and list.** [`build/check.sh`](build/check.sh) checks every market file against the schema and types, and writes [`directory.json`](directory.json) and [`directory.md`](directory.md) from the files.
3. **Read.** `directory.json` and each market file, read at one commit, tell an app, an AI or an index which fields to ask for, what a post's preview shows first, and how to check entries.

## Where things live

| Path | What it is |
|---|---|
| [`markets/`](markets/) | One JSON file per market |
| [`directory.json`](directory.json) | The machine-readable list of markets, written by `build/check.sh` |
| [`directory.md`](directory.md) | The human-readable list of markets, written by `build/check.sh` |
| [`build/README.md`](build/README.md) | The manual for writing and checking a market file |
| [`build/types.json`](build/types.json) | The field types every market builds from |
| [`build/market.schema.json`](build/market.schema.json) | The JSON Schema every market file must pass |

## Who decides what

- **Anyone** can propose a market here, or run a directory of their own.
- **This directory** is kept by the Open Forest Foundation, which reviews and merges pull requests so one trade does not split into ten names.
- **An index** chooses which directory it reads, at which commit, which markets it lists, and how it weighs what it reads.
- **The standard's escrow** defines the schedule format it runs ([escrows](https://github.com/foundationforest/standard/blob/main/escrows/README.md)); a market's schedules are templates of it.
