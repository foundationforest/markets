This repo is `markets`: the Forest Foundation's directory of recommended market names. One file per market at `<folder>/<name>.json`, listed in `directory.md`. `README.md` says what a market is and how indexes and apps use the directory; `CONTRIBUTING.md` says how to propose one.

Rules:
- Files suggest and never restrict. Nothing here allows, forbids or approves a market or a deal. No file sets a money or time value, and no field block lists `required` fields.
- Anyone may propose a market. A proposal is merged when `./check.sh` passes; nothing else is judged.
- The format is `schema/market.json`. `./check.sh` validates every market file against it, then checks what a JSON Schema can't state: each `required` name is one of its block's fields, each file sits at `<folder>/<name>.json`, and no two files share a name. Nothing here depends on the forest repo.
- The schema's lists of base offer and review fields copy forest's record shapes. When forest's change, update the lists.
- A market's name is in its badges as text, and the foundation's index counts badges only for names listed in `directory.md`. Never rename or remove a market, or drop its directory line, unless asked. Folders can move.
- Keep each `directory.md` line shaped ``- [`name`](folder/name.json): ...``: indexes read that shape.
- Plain language. No em-dashes. No crypto words in text a person reads: no "wallet", "USDC", "chain", "gas".
