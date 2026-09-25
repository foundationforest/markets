This repo is `markets`: the foundation's directory of Forest markets. Read this file, then fetch and read the full plan, `forest/docs/handoff.md`, at the start of every session: https://raw.githubusercontent.com/foundationforest/forest/main/docs/handoff.md. Its Markets section is this repo's spec. Work in plan mode. One task per session. Open a pull request; never push to main.

- Anyone can make any market. A market is a name, and the registry accepts any name.
- This repo holds the spellings the foundation recommends, so one trade doesn't split into ten names, grouped in categories for reading. A category is a folder and a heading in `directory.md`, never a program concept.
- Nothing here allows, forbids or approves anything. No list of excluded kinds, no statuses.
- Files carry no money or time values. Money, time, the arbiter and the timer are the seller's, per offer.
- The recommended badge scope is `market:role`, such as `plumbing:seller`.
- The four record shapes, the market template and its validator live in `forest/shapes`. This repo has no validator of its own: `check.sh` runs forest's.
- A file lives at `<category>/<name>.json`. The foundation merges mechanically: the file validates and the name isn't already here, as a file or as an alias in `directory.md`. No other rule.
- Plain language. No em-dashes.
- Never state design as shipped. Nothing is shipped.

When unsure whether something is settled, don't decide it: write the question in `docs/changes.md` and stop. At the end of every session append to `docs/changes.md`: built, learned, open.
