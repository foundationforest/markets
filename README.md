# markets

Part of [Forest](https://github.com/foundationforest). The shared standard for what people post
and review. [The standard](https://github.com/foundationforest/standard) defines no field of an
offer or a review: every shape lives here. Public domain ([CC0](LICENSE)).

## What it is

A market is a name people hold a profile in, one profile per role. Each market has one offer shape,
a way reviews work, a way deals go and a way payment works, all in one file.

## How it works

- A profile's label is `market/role`.
- Each role says whether its posts are offers, requests, or just posts. Every post is written at
  `offer/<id>` in the profile's folder, as
  [the standard says](https://github.com/foundationforest/standard/blob/main/records/README.md#folders).
- An index reads [`directory.json`](directory.json) and each market file at one commit. It reads
  posts by their fields' types, and counts only the roles a market lists.
- Anyone can propose a market here, and anyone can run a directory of their own.

## Where the markets are

In [`markets/`](markets/), one file each. There are none yet. [`directory.md`](directory.md) lists
them for people, written from `directory.json`; the foundation's index on devnet reads it every
hour.

## Build one

The manual: [`build/README.md`](build/README.md).

## Who decides what

- **The proposer** writes the market's file.
- **This directory** lists it. The Open Forest Foundation reviews and merges each pull request.
- **An index** chooses which directory it reads, at which commit, and how it weighs what it reads.
- **The standard's escrow** defines the schedule format it runs
  ([escrows](https://github.com/foundationforest/standard/tree/main/escrows)); a market's
  schedules are templates of it.
