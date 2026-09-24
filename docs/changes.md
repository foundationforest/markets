Log of what was built, learned, and left open, appended at the end of every session.

## 2026-09-24: session 1, directory, template, first draft files

- **Built:**
  - `CLAUDE.md`, `directory.md`, `template.md`, `check.sh`, this file, and a new `README.md`. The old one-line README said the repo holds "every market anyone has written"; only standard names live here.
  - 18 market files, six per category, every one marked "draft: first three to be chosen with real sellers". `freelance-work/tutoring.json` is forest's `shapes/examples/markets/online-tutors.json`, renamed and adjusted to the same style as the rest.
  - `check.sh`: clones forest (main, depth 1) into a temporary folder, runs `npm ci` in `shapes/`, runs `bin/validate.js market` on every `*/*.json`, then checks this repo's two naming rules. All 18 files pass.
- **Decided (by the task):**
  - A category is a folder and a page (its section of `directory.md`), never a program concept. This answers part of the handoff's open "What a category file holds": for now there is no category file.
  - This repo has no validator of its own: `check.sh` runs forest's command line. This closes "whether the `markets` validator reuses `shapes/`' validator", open in forest since its session 1.
  - The foundation merges by mechanical rules only: the file validates and the name is not a duplicate. No judgement of the market itself.
- **Chosen, not decided** (the simplest option; each reversible before anything ships):
  - **The words live outside the files.** The task asked each file to hold a one-line description and a reason for each value. The validator allows exactly seven keys, `suggested` exactly two and a step exactly two, and JSON has no comments, so either would fail. Descriptions and reasons are in `directory.md`; the files are data only. A field's lexicon `description` says what the field is.
  - **Roles are `seller` and `buyer` in every file**, `tutoring` included (forest's example had `tutor` and `student`). Because one pair lets an app or an index treat every market alike, and the handoff's own scope example is `online-tutors:seller`.
  - **No field is required.** forest's example required `subjects`; that line is gone. Because a required field refuses posts, and a file suggests and never restricts.
  - **Suggested values are per category, not per market.** With no sellers yet, nothing tells plumbing's values from cleaning's.
    - `home-services`: auto-release after 2 days; 100% back up to 24 hours before the visit, 50% until it starts.
    - `freelance-work`: 7 days, forest's example's value; no steps.
    - `buy-and-sell`: 1 day, the least an escrow holds; no steps.
  - **One or two post fields per category:**
    - `appointmentWindowHours`: an integer, at least 0.
    - `deliveryDays`: an integer, at least 1. Days rather than a date, because an offer is used for many deals.
    - `condition`: a string with `knownValues` (new, like-new, good, fair, for-parts), so the words suggest and never restrict.
    - `ships`: a boolean.
    - `tutoring` keeps `subjects` and `languages` from forest's example and has no `deliveryDays`.
  - **`check.sh` checks two rules beyond the validator:** a file lives at `<category>/<name>.json` (so its category matches its folder), and no name is used twice. Because "the name is not a duplicate" is a merge rule, and a script can check it.
  - **`check.sh` uses `npm ci`, not `npm install`,** so it installs forest's locked versions and never edits the lockfile. It checks against forest's main branch, not a pinned commit, so a rule change there can fail a file here that passed before.
  - The one-line market descriptions in `directory.md`.
- **Learned:**
  - The validator refuses a `description` key ("unknown key"). On a scratch copy, `check.sh` also caught a file at the wrong path and a name used twice, and exited 1.
  - `knownValues` works as a suggestion: a post with `"condition": "mint, boxed"` passes against `phones`. A seller's own terms that differ from the suggestion (3 days, one step) pass too.
  - forest's example post (`market: online-tutors`, `role: tutor`) does not validate against `tutoring.json`: the name and the roles changed. forest's fixture is its own test and still passes there.
  - Negative step hours work in the escrow program: `cancel_buyer` needs the clock start to be known (accepted and funded), not reached, so a step can fall before the service time.
- **Open:**
  1. **Mechanical merging versus the handoff.** The handoff says "wellness and health are out". A merge by mechanical rules only would accept a `wellness` or `pharmacy` file, or a market in something illegal where the foundation is. Either the merge rules gain a short list of excluded kinds, or that handoff line goes. A question for the lawyer pass too.
  2. **Which three markets launch first**, and their real values. Still the handoff's open item. Every file here is a draft.
  3. **Shipments and one day's auto-release.** A parcel that arrives late can pay the seller before the buyer has it, unless the buyer objects in time. A seller who ships can set more days. Whether the suggestion should differ for handover and shipment is open.
  4. **Tutoring's shape.** A lesson is sold per session: a time, not a due date, which is closer to a visit. Its file keeps the freelance values (7 days, no steps), as forest's example did. Its sellers may want steps like a visit's.
  5. **Scopes per market, or per market and role.** A `markets` repo decision in the handoff; not decided here. With `seller` and `buyer` everywhere, either works.
  6. **Changing a standard file.** The merge rules cover adding a file. How a change to an existing one is merged (new fields, new values, a rename) is not written. A rename strands badges, since a badge's scope is a hash of the market name.
  7. **forest's words on categories.** The handoff and `shapes/README.md` say a later category is "a new category file". Here a category is a folder and a page. Not changed from here: one repo per session.
  8. **`remote` on goods.** The post's base `remote` means "the work happens online", which does not fit a thing for sale. `ships` covers it in `buy-and-sell`; the base field's meaning for goods is forest's to settle.
  9. **No automatic check.** `check.sh` runs by hand. A workflow running it on every pull request would make the merge rule automatic. Not built: not asked for.
