This repo is `markets`: the shared standard for content on Forest. Every shape of a post or a review
lives here; the standard (`foundationforest/standard`) holds no content fields. Read `README.md` and
`build/README.md` before any task.

## Words

Use these words: market, role, post, offer, request, field, type, schedule, window, direct, escrow,
index, directory. Plain words, no em-dashes.

## How to work in this repo

- One task per session. Open a pull request; never push to main.
- A session never opens a pull request or acts in another repo, even to protect something live: it
  flags it and waits.
- Run `build/check.sh` before you push, and commit the `directory.md` it writes. Never edit
  `directory.md` by hand.
- Market files are data. The manual, `build/README.md`, is the only prose that teaches how to build
  a market; the README says what this is and points to it.
- The standard holds no content fields: what a post or a review holds is defined here, never in
  `foundationforest/standard`.
- Say "on devnet" for what runs; never state anything as shipped.
