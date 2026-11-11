This repo is `markets`: the shared standard for content on Forest. The shape of every entry lives
here; the standard (`foundationforest/standard`) holds no content fields. Read `README.md` and
`build/README.md` before any task.

## Words

Use these words: market, role, label, listing, review, vouch, report, field, type; and entry, file,
index, directory where needed.

- listing: an offer or a request; the profile's role says which, by its `listings` value
  (`offers`, `requests`). Always at `listing/<id>`.
- review, vouch, report: each about one profile, which it names as its subject.
- feedback: what people say about a profile, its reviews, vouches and reports. A word for docs and
  apps, never a kind.
- family: markets whose names start with the same word, such as `home-repair` and `home-cleaning`.
  A word for names and docs, never a kind, field or key.
- post: only the everyday verb, to post a listing, a review, a vouch or a report. No kind, field,
  path or heading uses it as a noun.

In prose the foundation is the Forest Foundation; its registered name, Open Forest Foundation, is
for legal text only. Plain words, no em-dashes.

## How to work in this repo

- One task per session. Open a pull request; never push to main.
- A pull request's title says what changed, in plain words, readable on its own: no session codes
  or item numbers. Each pull request lands as one commit under its title.
- A live market only grows: `build/check.sh` fails on any change that would stop a listing or review
  already posted from fitting, or change what a profile is, and a live market that must break
  becomes a new market, with a new name. A beta market may change in any way, and a pull request
  that breaks one still says so at its top, plainly: which entries stop fitting until they are
  posted again, and who must follow, in order: services first, then the app.
- A session never opens a pull request or acts in another repo, even to protect something live: it
  flags it and waits.
- Run `build/check.sh` before you push. It writes both `directory.json` and `directory.md` from
  `markets/*.json`; commit them. Never edit either by hand.
- Market files are data. Each doc says what its reader needs, once: the README says what a market
  is, what is here, how to add one and who decides what, and points to the manual; the manual,
  `build/README.md`, is the only prose that teaches how to build a market or use the package. A cut
  moves each fact to the doc whose reader needs it, and drops only what another repo owns.
- The manual is for people and AIs who will build markets nobody here thought of. It states as a
  rule only what the checks enforce (`build/check.sh`, `checkEntry`, and the test on every market's
  values), each once with its reason; everything else is advice, with its reason, never a must. Its
  examples are its own, never a file in `markets/`, so it holds whatever `markets/` holds.
- The standard holds no content fields: what an entry holds is defined here, never in
  `foundationforest/standard`.
- Never say which network something runs on; network ids may appear as examples of a format. Never
  state anything as shipped.
