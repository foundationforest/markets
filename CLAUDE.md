This repo is `markets`: the foundation's directory of Forest markets, one file per market at `<folder>/<market>.json`, listed in `directory.md`, explained in `README.md`.
Files suggest and never restrict: nothing here allows, forbids or approves a market or a deal, and no file sets a money or time value.
The market file's schema and its validator live in `forest/shapes`; `check.sh` runs forest's validator on every file and refuses a name that's already a market.
At the start of every session, fetch and read https://raw.githubusercontent.com/foundationforest/forest/main/docs/handoff.md.
Plain language. No em-dashes.
