This repo is `markets`: the standard Forest market names and one file for each. Read this file, then fetch and read the full plan, `forest/docs/handoff.md`, at the start of every session: https://raw.githubusercontent.com/foundationforest/forest/main/docs/handoff.md. Work in plan mode. One task per session. Open a pull request; never push to main.

- Only names here count in indexes and badges. Anyone can write a market file elsewhere; it carries no weight.
- A market file suggests and never restricts. The arbiter is always available, any accepted token works, and the seller sets the terms per offer.
- The four record shapes (profile, post, review, credential), the market template and its validator live in `forest/shapes`. This repo has no validator of its own: `check.sh` runs forest's.
- A file lives at `<category>/<name>.json`. A category is a folder and a page (its section of `directory.md`), never a program concept. A badge is per market.
- The foundation merges by mechanical rules only: the file validates and the name is not a duplicate.
- Plain language. No em-dashes.
- Never state design as shipped. Nothing is shipped.

When unsure whether something is settled, don't decide it: write the question in `docs/changes.md` and stop. At the end of every session append to `docs/changes.md`: built, learned, open.
