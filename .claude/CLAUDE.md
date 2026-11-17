This repo is `markets`: the shared standard for content on Forest. The shape of every entry lives
here; the standard (`foundationforest/standard`) holds no content fields. Read `README.md` and
`build/README.md` before any task.

## Words

Use these words: market, role, label, listing, review, vouch, report, field, piece, rule, suggestion;
and entry, file, index, directory where needed.

- piece: one of the eight questions any listing can answer (text, choice, number, price, place,
  date, photo, link). A field is one piece with a name.
- rule and suggestion: a market file's two kinds of lines. A rule is checked against each entry; a
  suggestion, under `ask`, never is. A line a reader cannot see in an entry is never a rule.

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
- A live market only grows, on its rules: `build/check.sh` fails on any change that would stop a
  listing or review already posted from fitting, or change what a profile is, and a live market that
  must break becomes a new market, with a new name. Its suggestions may change at any time. A shared
  list in `build/lists.json` only grows too. Nothing yet holds the pieces themselves to only growing,
  since `build/types.json` went: a check for that is needed before the first market goes live. A beta market may change in any way, and a pull request
  that breaks one still says so at its top, plainly: which entries stop fitting until they are
  posted again, and who must follow, in order: services first, then the app.
- A session never opens a pull request or acts in another repo, even to protect something live: it
  flags it and waits.
- Run `build/check.sh` before you push. It writes both `directory.json` and `directory.md` from
  `markets/*.json`; commit them. Never edit either by hand.
- Market files are data, and nothing in one is written only for AIs: the question a person reads in a
  form is what an AI reads. Each doc says what its reader needs, once: the README, in about 600
  words, says what a builder cannot guess, as reasons (why markets are narrow, why a name is costly
  to change, where to draw the line), what this repo takes now, as the Forest Foundation's call, and
  how to propose, and points to the pieces page; the pieces page, `build/README.md`, in about 1,500
  words, is the standard: the only prose that says what a piece, a market file and an entry hold and
  how a program uses the package. A cut moves each fact to the doc whose reader needs it, and drops
  only what another repo owns.
- The pieces page is for people and AIs who will build markets nobody here thought of: it gives the
  standard and the reasons, and leaves the judgment to them. It states as a rule only what the checks
  enforce (`build/check.sh` and `checkEntry`), each once with its reason; everything else is advice,
  with its reason, never a must. Its examples are its own, never a file in `markets/`, so it holds
  whatever `markets/` holds.
- The standard holds no content fields: what an entry holds, pieces included, is defined here, never
  in `foundationforest/standard`.
- Never say which network something runs on; network ids may appear as examples of a format. Never
  state anything as shipped.
