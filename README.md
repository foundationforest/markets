# markets

A market is a kind of dealing, like tutoring or selling things you own. This repo holds
[Forest](https://github.com/foundationforest)'s markets: for each one, the roles people play in it
and what their listings and reviews hold, so everyone in a market writes the same shape. It holds
what every entry holds; [the standard](https://github.com/foundationforest/standard) says how
entries are signed and stored, and names no content. Everything here is [CC0](LICENSE).

| Path | What it is |
|---|---|
| [`directory.json`](directory.json), [`directory.md`](directory.md) | The list of markets |
| [`markets/<name>.json`](markets/) | One market |
| [`build/`](build/) | [The pieces page](build/README.md), the standard every market is written in; the shared lists, the icons, the check, and the package programs import |

## Why markets are narrow

A person's profiles come from one seed, one per market and role, and nothing public links them. But
anyone you deal with can learn who is behind your profile, and then read everything it did in that
market: each listing, and each review of it. A narrower market shows each of them less.

What carries between profiles is trust, by
[proofs](https://github.com/foundationforest/standard/blob/main/proofs/README.md) that name no
profile, such as a verifier's stamp on the seed. What stays in a market is its ratings, which are
about skill. So splitting a market restarts only the ratings, and ratings should restart when the
skill changes.

## Why a name is costly to change

A market's name and its roles' words make each profile's label, `<market>/<role>`, and the label
makes the profile's key. So a new name is a new market: its ratings start again, beside the old one,
since a live market is never removed. Pick a name still right when the market grows: `goods`
outlasts the first kind sold there.

## Where to draw the line

First read [`directory.md`](directory.md): the market may be there. If not, ask two questions of the
nearest, about both sides of the deal:

1. **Good at the same things?** Leave out trust, which carries anyway, and compare what a good
   review of each would praise. A maths tutor and a physics tutor are praised alike; a tutor and a
   tennis coach are not, so they split. The same question tells roles apart.
2. **Fine to show together?** If one profile holding both would tell the people you deal with
   something they would keep apart, split: a jacket's buyer need not see that you sold a car.

Both pass: one market, since splitting would restart ratings that should carry. A topic is then a
field, which can apply only `when` another answer calls for it. Each market needs its own crowd
before anyone finds a deal, which argues for few markets, never for merging two that fail a
question.

## What earns a field

A field stays when nearly everyone in its role can answer it, and the other side would filter on
it, match on it, or need to see it, as a photo or a link. Anything else is words in `description`,
whose hint may name it, such as "how often, pets at home": each question costs the person filling
the form, and one nobody filters on buys nothing.

## What this repo takes now

Which markets this repo takes is the Forest Foundation's call, by this line, never whether a market
is worth having. Until a deal's money can wait in escrow, with an arbiter for a dispute, it takes
only markets where a deal gone wrong costs little:

- **Beta**: nobody, on either side, risks more than they could lose to a stranger without real harm
  before they get something, and a deal gone wrong is fixed tomorrow with someone else. Small works
  because a verifier stamps each person once: someone who takes the money and vanishes leaves a
  reported profile behind and cannot start clean.
- **Live**: all of that, no money between people until escrow exists, and tried, with listings and
  reviews posted in it end to end, through an app and through an AI. From then on it only grows.

A market that cannot be beta waits for the service that would make it accountable. Where its line
is, its name, its icon and its fields are for whoever proposes it to weigh.

## Propose

1. Write `markets/<name>.json` as [the pieces page](build/README.md) says, numbered the highest in
   `directory.json` plus one.
2. Run [`build/check.sh`](build/check.sh) (Node 22.18 or later, npm and git) until it passes: it
   rewrites a stale directory file and fails once. Never edit either by hand. Then run `npm test` in
   `build/`.
3. Commit the market file and both directory files, and open a pull request. The checks run again,
   and the Forest Foundation reviews it.
