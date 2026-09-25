# markets

The foundation's directory of Forest markets: the spellings it recommends, so one trade doesn't split into ten names, grouped in categories for reading. Anyone can make any market, under any name. Nothing here allows, forbids or approves anything.

- [`directory.md`](directory.md): the recommended markets by category, the recommended badge scope (`market:role`) and other common spellings of each market.
- [`template.md`](template.md): the market file, field by field.
- `<category>/<name>.json`: one file per recommended market.
- [`check.sh`](check.sh): checks every file against forest's validator.

The four record shapes, the market template and the validator live in [`forest/shapes`](https://github.com/foundationforest/forest/tree/main/shapes). The full plan is [`forest/docs/handoff.md`](https://github.com/foundationforest/forest/blob/main/docs/handoff.md). Nothing is shipped.

## The market file

Five required keys, `name`, `category`, `fields`, `evidenceTypes`, `credentialIssuers`, and two optional ones, `description` and `roles`. Nothing else, and nothing about money or time. [`template.md`](template.md) goes through each.

## Adding a market

Open a pull request with a file that passes `check.sh`:

1. Pick a category and a name: a lowercase slug that no file here uses and that isn't listed as an alias in [`directory.md`](directory.md#aliases). A new category is a new folder.
2. Copy a file to `<category>/<name>.json` and change its `name`, `category`, `description` and `fields`.
3. Add its line, and any other common spellings, to [`directory.md`](directory.md).
4. Run `./check.sh`. It needs git, Node 22 and npm, and must end with "all ... market files pass".
5. Open the pull request.

## How the foundation merges

Mechanically. It merges when:

- the file validates, and
- the name isn't already here: no file has it, and it isn't listed as an alias in `directory.md`.

No other rule. `check.sh` checks both: it runs forest's validator on every file, and since a file lives at `<category>/<name>.json`, it checks each path against the file's name and category, then that no two files share a name and no file takes a name listed as an alias.

## License

CC0 1.0: see [`LICENSE`](LICENSE).
