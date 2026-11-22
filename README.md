# markets

A market is a kind of dealing, like tutoring or selling things you own. This repo holds
[Forest](https://github.com/foundationforest)'s markets: each one's roles, and what their listings
and reviews hold, so a market's entries share one shape.
[The standard](https://github.com/foundationforest/standard) says how entries are signed and stored,
and names no content. Everything here is [CC0](LICENSE).

| Path | What it is |
|---|---|
| [`directory.json`](directory.json), [`directory.md`](directory.md) | The list of markets |
| [`markets/<name>.json`](markets/) | One market |
| [`build/`](build/) | [The pieces page](build/README.md), the standard every market is written in; the shared lists, the icons, the check, and the package programs import |

## Why markets are narrow

A person's profiles come from one seed, one per market and role, and nothing public links them. But
anyone you deal with can learn who is behind your profile, then read all it did in that market: a
narrower market shows them less.

Trust carries between profiles, by
[proofs](https://github.com/foundationforest/standard/blob/main/proofs/README.md) that name no
profile, such as a verifier's stamp on the seed. Ratings stay in a market, and are about skill. So
splitting a market restarts only the ratings, which should restart when the skill changes.

## Why a name is costly to change

A market's name and its roles' words make each profile's label, `<market>/<role>`, and the label
makes its key. So a new name is a new market, its ratings restarted beside the old one, since a live
market is never removed. Name the thing, then the word that tells its dealings apart:
`goods-selling`, `home-cleaning`, `stays-work`; or one word, `tutoring`, when nothing needs telling
apart. `goods` alone was this repo's mistake: renting goods is another dealing.

## Where to draw the line

If [`directory.md`](directory.md) lacks the market, ask two questions of the nearest, about both
sides of the deal:

1. **Good at the same things?** Leave out trust, which carries anyway, and compare what a good
   review of each would praise. A maths tutor and a physics tutor are praised alike; a tutor and a
   tennis coach are not, so they split. The same question tells roles apart.
2. **Fine to show together?** If one profile holding both would tell the people you deal with
   something they would keep apart, split: a jacket's buyer need not see that you sold a car.

Both pass: one market, where a topic is a field that applies only `when` another answer calls for
it. Each market needs its own crowd, which argues for few markets, never for merging two that fail a
question. A summary, which is how people pick a market, is as broad as it and speaks to both sides;
its description draws the line with its neighbours.

## What earns a field

Each question costs everyone who fills the form, so an answer lives in one of three places:

- **Its own field**, when nearly everyone in the role has one and a mismatch ends the deal before it
  starts: only then does a filter repay the question.
- **A tick in a checklist**, a choice with `several`, for yes-or-no extras: one question, one tap
  each, still matched.
- **The description**, for limits and preferences, which differ by person and get talked over; its
  hint may name them, such as "how long, who you host".

Languages earn a field where the two sides usually come from different places and must talk: stays,
tours, tutoring, language exchange, software development. A review is a score and words: a dishonest
deal is a report, an honest one a review, so a market seldom adds to it.

## What this repo takes now

Which markets this repo takes is the Forest Foundation's call, by this line, never whether a market
is worth having. Until money can wait in escrow, with an arbiter for disputes, it takes only markets
where a deal gone wrong costs little:

- **Beta**: nobody risks more than they could lose to a stranger without real harm before they get
  something, and a deal gone wrong is fixed tomorrow with someone else. Small works because a
  verifier stamps each person once: whoever takes the money and vanishes leaves a reported profile,
  and cannot start clean.
- **Live**: all of that, no money between people until escrow exists, and tried, posting listings
  and reviews end to end through an app and an AI. Then it only grows.

A market that cannot be beta waits for the service that would make it accountable. Its line, name,
icon and fields are its proposer's to weigh.

## Propose

1. Write `markets/<name>.json` as [the pieces page](build/README.md) says, numbered the highest in
   `directory.json` plus one.
2. Run [`build/check.sh`](build/check.sh) (Node 22.18 or later, npm and git) until it passes: it
   rewrites a stale directory file, which nobody edits by hand, and fails once. Then run `npm test`
   in `build/`.
3. Commit the market file and both directory files, and open a pull request: the checks run again,
   and the Forest Foundation reviews it.
