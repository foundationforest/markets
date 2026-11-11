# markets

A market is a kind of dealing, like tutoring or selling things you own. This repo holds [Forest](https://github.com/foundationforest)'s markets: for each one, the roles people play in it and what their listings and reviews hold. Apps, indexes and AIs read these files, so everyone in a market writes the same shape. Everything here is [CC0](LICENSE): anyone can copy it.

## What's here

| Path | What it is |
|---|---|
| [`directory.json`](directory.json), [`directory.md`](directory.md) | The list of markets |
| [`markets/<name>.json`](markets/) | One market: whether it is live or beta, its roles, its listing fields, and any extra review fields |
| [`build/`](build/) | The manual for writing a market, the shared types, the icons a market may name, the check, and the package programs import |

## How a market works

- A profile's label names its market and its role, like `tutoring/tutor`.
- A role's listings are offers or requests, at `listing/<id>`, with the fields its market lists.
- Reviews, vouches and reports have one shape in every market: a review says how a deal with a profile went, with a score; a vouch is a review with no score and no deal ("I know they're real and honest"); a report says "this is fake or a scam". A market may add fields to its reviews only.
- Payments come later, through the standard's [escrow](https://github.com/foundationforest/standard/blob/main/escrows/README.md).

## Add a market

Open a pull request with one file in `markets/` and its line in the directory, following [the manual](build/README.md). [`build/check.sh`](build/check.sh) must pass.

## Who decides what

- **[The standard](https://github.com/foundationforest/standard):** how anything is signed and stored. It names no content.
- **This repo:** what every entry holds, in each market.
- **Whoever proposes a market:** where its line is, its name, its icon and its fields, by [the manual](build/README.md)'s reasons. [`build/check.sh`](build/check.sh) holds the file to the manual's rules.
- **The Forest Foundation:** only whether this repo takes a market: that it fits the manual, isn't here already, and is under [the line for which markets the repo takes now](build/README.md#which-markets-this-repo-takes); never whether the market is worth having.
- **Each index:** which directory and markets it reads, and how it ranks.
- **Each app or AI:** how it shows a market.
