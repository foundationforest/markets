# markets

The standard names of Forest markets, and one file for each. Only names here count in indexes and badges. Anyone can write a market file anywhere else; it carries no weight.

- [`directory.md`](directory.md): every standard name, by category, with what each market is and why its values are what they are.
- [`template.md`](template.md): the market file, field by field.
- `<category>/<name>.json`: one file per market.
- [`check.sh`](check.sh): checks every file against forest's validator.

The four record shapes, the market template and the validator live in [`forest/shapes`](https://github.com/foundationforest/forest/tree/main/shapes). The full plan is [`forest/docs/handoff.md`](https://github.com/foundationforest/forest/blob/main/docs/handoff.md). Nothing is shipped: every file here is a draft.

## What "standard" means

A market name is standard when its file is merged here. Indexes count deals and badges under standard names, and give no weight to others.

Standard is about the name, not the market. It says nothing about whether the market is good, busy or wise.

## Proposing a market

1. Pick a category (`home-services`, `freelance-work` or `buy-and-sell`) and a name: a lowercase slug no file here uses.
2. Copy a file from that category to `<category>/<name>.json` and change its `name`. Add fields if the market needs them ([`template.md`](template.md) says how).
3. Add a row for it in [`directory.md`](directory.md): what it is, and why any value differs from its category's.
4. Run `./check.sh`. It needs git, Node 22 and npm, and must end with "all ... market files pass".
5. Open a pull request.

A new category is proposed the same way: a new folder, and a new section in `directory.md`.

## How the foundation merges

By mechanical rules only:

- the file validates: `check.sh` passes, which also checks the file lives at `<category>/<name>.json`;
- the name is not a duplicate.

Nothing else. There is no judgement of the market itself.

## License

CC0 1.0: see [`LICENSE`](LICENSE).
