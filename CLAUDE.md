This repo is `markets`: the shared standard for content on Forest. Every shape of a post or a review
lives here; the standard (`foundationforest/standard`) holds no content fields. Read `README.md` and
`build/README.md` before any task.

## Words

Use these words: market, role, label, post, review, vouch, report, field, type; and entry, file,
index, directory where needed. A post is an offer, a request or a plain post, by its role's `posts`
value (`offers`, `requests`, `posts`), and is always at `post/<id>`. In prose the foundation is the
Forest Foundation; its registered name, Open Forest Foundation, is for legal text only. Plain
words, no em-dashes.

## How to work in this repo

- One task per session. Open a pull request; never push to main.
- A session never opens a pull request or acts in another repo, even to protect something live: it
  flags it and waits.
- Run `build/check.sh` before you push. It writes both `directory.json` and `directory.md` from
  `markets/*.json`; commit them. Never edit either by hand.
- Market files are data. Each doc says what its reader needs, once: the README says what a market
  is, what is here, how to add one and who decides what, and points to the manual; the manual,
  `build/README.md`, is the only prose that teaches how to build a market or use the package. A cut
  moves each fact to the doc whose reader needs it, and drops only what another repo owns.
- The standard holds no content fields: what a post or a review holds is defined here, never in
  `foundationforest/standard`.
- Never say which network something runs on; network ids may appear as examples of a format. Never
  state anything as shipped.
