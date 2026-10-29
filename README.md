# markets

A market is a kind of dealing, like tutoring or selling electronics. This repo holds [Forest](https://github.com/foundationforest)'s markets: for each one, the roles people play in it and what their posts and reviews hold. Apps, indexes and AIs read these files, so everyone in a market writes the same shape. Everything here is [CC0](LICENSE): anyone can copy it.

## What's here

| Path | What it is |
|---|---|
| [`directory.json`](directory.json), [`directory.md`](directory.md) | The list of markets |
| [`markets/<name>.json`](markets/) | One market: its roles, its post fields, and any extra review fields |
| [`build/`](build/) | The manual for writing a market, the shared types, the check, and the package programs import |

## How a market works

- A profile's label names its market and its role, like `tutoring/tutor`.
- A role's posts are offers, requests or plain posts, at `post/<id>`, with the fields its market lists.
- Reviews, vouches and reports have one shape in every market. A market may add fields to its reviews only.
- Payments come later, through the standard's [escrow](https://github.com/foundationforest/standard/blob/main/escrows/README.md).

## Add a market

Open a pull request with one file in `markets/` and its line in the directory, following [the manual](build/README.md). [`build/check.sh`](build/check.sh) must pass. The Forest Foundation checks only that it fits the manual and isn't a duplicate, never whether the market is worth having.

## Who decides what

- **[The standard](https://github.com/foundationforest/standard):** how anything is signed and stored. It names no content.
- **This repo:** what each market's posts and reviews hold.
- **Each index:** which directory and markets it reads, and how it ranks.
- **Each app or AI:** how it shows a market.
