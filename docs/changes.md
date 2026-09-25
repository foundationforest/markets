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

## 2026-09-25: session 2, open directory, scopes, aliases

Built on top of markets PR #1 (session 1), which was still open.

- **Built:**
  - All 18 market files rewritten to forest's current market template: `name`, `category`, `description`, `roles`, `fields`, `evidenceTypes`, `credentialIssuers`. No `suggested` block: no auto-release days, no cancellation steps, nothing about money or time.
  - `directory.md` rewritten: per category, one paragraph on how deals usually go and one line per market. New sections "Scopes" and "Aliases". No statuses, no draft marks, no tables of values, no excluded kinds.
  - `template.md` rewritten field by field from forest's `MARKET_REQUIRED_KEYS` and `MARKET_KEYS`. `README.md` rewritten: how to add a market, and that the foundation merges mechanically.
  - `CLAUDE.md` rewritten to the open directory.
  - `check.sh` also refuses a file whose name is listed as an alias in `directory.md`'s Aliases table, which it reads. `./check.sh` passes all 18 files against forest main (`08459a3`).
- **Decided (by the task and forest's plan):**
  - Anyone can make any market; this repo holds the recommended spellings; nothing here allows, forbids or approves anything. Closes session 1's open item 1 (excluded kinds).
  - Files carry no money or time values. Closes item 3: there is no auto-release left to suggest. Session 1's suggested values per category are gone.
  - Categories are only for reading, and `tutoring` stays in `freelance-work`. Closes item 4.
  - The recommended badge scope is `market:role`, such as `plumbing:seller`. Closes item 5. The task first said `market/role`, as forest's plan does; at review it became a colon, to match forest's index.
  - "The name isn't already here" covers aliases: `check.sh` refuses a file whose name is listed as an alias (decided at review).
  - A category is a folder and a page; forest's plan now says so too. Closes item 7.
- **Chosen, not decided** (each reversible, nothing ships):
  - **`roles` written out in every file**, though `seller` and `buyer` are the default when it's left out. The task named them, and a reader sees the sides without knowing the default.
  - **`credentialIssuers: []` kept in every file.** The task's field list left it out, but forest's validator requires it.
  - **Extra fields unchanged from session 1:** `appointmentWindowHours`, `deliveryDays`, `tutoring`'s `subjects` and `languages`, `condition` and `ships`. `ships` stays because shipped or handed over is part of most goods offers.
  - **The category paragraphs and the aliases.** 62 aliases across 18 markets: all slugs, none another market's name, none listed twice. Spellings that could mean a different trade are left out (editing, repairs, lessons).
  - **README step 3 asks for a `directory.md` line.** A missing line is not a reason to refuse a merge; the two checks are the only rules.
- **Learned:**
  - When this session planned, forest main still had the old plan and validator: a file on the new template failed there ("missing suggested", "unknown key description"). forest PR #19 merged overnight, and main's `shapes/`, handoff and `CLAUDE.md` now match it byte for byte.
  - `check.sh` on a scratch copy: a `suggested` key, a duplicate name, a file in the wrong folder and a file named `plumber` (an alias of `plumbing`) each fail with exit 1.
  - A `phones` post with `"condition": "mint, boxed"` and a field no market declares passes; a role outside the file's roles fails.
  - The base post lexicon requires `remote`, so every goods post must carry `"remote": false`. This sharpens session 1's open item 8.
  - The longest scope here, `video-editing:seller`, is 20 bytes, under the registry's 64-byte bound that forest lists as open.
- **Open:**
  1. **forest's plan still says `market/role`.** This repo and forest's index (`splitScope` in `index/src/markets.ts`) use a colon; forest's handoff (Markets), `CLAUDE.md` and `shapes/README.md` still say a slash. forest's words need to follow; not changed from here.
  2. **Where indexes read aliases.** forest's index keeps its own `index/config/aliases.json`, whose one entry is `online-tutors`, not a name here (it's an alias of `tutoring`). Whether indexes read the table in `directory.md`, or this repo also carries a machine-readable list, is open. A market file can't hold aliases: the key would fail.
  3. **The alias check reads `directory.md` as it stands in the pull request.** A pull request that removes `plumber` from the table and adds `plumber.json` passes. Whether the check should compare against main is open.
  4. **Whether a market file keeps `credentialIssuers`** is open in forest's plan.
  5. Still open from session 1: which three markets launch first; how a change to an existing file is merged (a rename strands badges); `remote` on goods, now required (see Learned); no automatic check on pull requests.

## 2026-09-25: session 3, the guide, and every market discussed

Built from main (`e430122`); no markets pull request was open. A forest session is changing the market schema at the same time; nothing of it was pushed while this one ran.

- **Built:**
  - `README.md`: the guide (version 1), verbatim from the task.
  - `CLAUDE.md`: five lines.
  - 57 market files, one per market in the guide's examples table, in 16 folders. Each has, in this order: `name`, `folder`, `description`, `sides`, `labels` (12 files only), `money`, `evidenceTypes`, `offerFields`, `reviewFields`, `ratings`, `howDealsGo`. Nothing else.
  - `directory.md`: the 17 folders in the guide's order, one sentence each, and one line per market with its sides and whether money moves. No Scopes or Aliases sections.
  - `check.sh`: same purpose. It runs forest's validator on every file, then checks each file lives at `<folder>/<name>.json` and no two files share a name. The alias check is gone with the table.
  - Removed: `template.md` (it described the old schema), the three old folders, and `phones`, `computers`, `software`, `furniture` and `tools`. `electronics` covers phones and computers, `coding` covers software; furniture and tools aren't in the guide.
- **Decided (by the task and at plan review):**
  - The key names above, given by the task. `category`, `roles`, `fields` and `credentialIssuers` are gone from the files.
  - Labels only on stays (host, guest), property-rentals (landlord, tenant), tutoring, courses and music-lessons (teacher, student), rides (driver, rider) and the five media markets (creator, viewer).
  - The Aliases table is dropped. The forest session removes the index's alias reading.
  - The badge scope is `market/role`, with a slash, as the guide and forest's index say. This closes the handoff's open item that this repo said a colon.
- **Chosen, not decided** (each reversible, nothing ships):
  - **`offerFields` is a map of field name to a lexicon field definition,** flat types only, as `fields.post.properties` was. `reviewFields` is `{}` everywhere, since the guide puts a match result "later".
  - **One definition per field name,** identical in every file that uses it: 39 fields. The old ones kept their wording (`appointmentWindowHours`, `deliveryDays`, `condition`, `ships`, `subjects`, `languages`). New ones include `year`, `mileageKm`, `bedrooms`, `guests`, `homeVisits`, `cuisines`, `headcount`, `maxKg`, `countries`, `revisions`, `license`, `species` and `level`. No field is required.
  - **Rating names:** `overall` first, then at most two more a buyer can judge (punctuality, accuracy, cleanliness, location, care, clarity, communication, food, safety, thoroughness, tidiness). Five markets have `overall` only.
  - **Media has `money: true`,** read as "money can move here", since the guide says free or paid.
  - **The `howDealsGo` texts say what each escrow option does in that market and why, not how often people use it.** No deal has run, so nothing is known about habits. Four patterns, tuned per market: a visit (pay at booking, release after, a timer to the seller set past the visit), goods (one tap in person; shipped, release on arrival, a timer to the seller set past the expected arrival), rentals (a deposit as a second escrow, a timer to the buyer on it), remote work (release on delivery, milestones as several escrows, a timer to the seller with its trade-off said plainly). No numbers in any of them.
  - **`travel-and-stays` is listed with no markets.** The guide's table puts `stays` under `property`, and the README is verbatim, so the table wins.
- **Learned:**
  - `check.sh` against forest main fails all 57 files, and only on the keys ("missing category", "unknown key folder" and so on). It will pass only once forest's schema session merges, and only if its key names match these.
  - Every offer-field definition passes forest's current validator when mapped to `fields.post.properties`: names, types, no base post field reused, and the merged lexicon still valid.
  - On a scratch copy, `check.sh` refuses a second `plumbing` in another folder and a file in the wrong folder, exit 1.
  - forest's index reads `directory.md` lines shaped ``- [`name`](folder/name.json): ...``. The new lines keep that shape. The index also reads `category` and `roles` from each file, which now don't exist.
- **Open:**
  1. **forest's key names.** If the schema session names any key differently, these files change to match it.
  2. **forest's index** needs `folder` for the path check, the roles from `sides` (`seller` and `buyer`, or `peer`), and no alias table. The forest session's change.
  3. **A post in a no-money market still needs a `price`:** the base post lexicon requires it. tennis, running-partners and study-partners can't post a valid offer until that changes in forest.
  4. **No-money markets have no evidence type,** so under today's index their reviews weigh near zero. The guide puts check-in evidence "later".
  5. **Names that read two ways,** frozen at the first badge: `training` (pets, not people), `security` (event guards, not computer security), `bikes` (bicycles), `hair`, `legal`. Worth one look before any badge exists.
  6. **Ratings:** the guide says named ratings from 1.0 to 10.0; the review lexicon today has one rating from 1 to 5. forest's to change.
  7. **The handoff's Markets section** still describes the alias table and a market file with `category` and `roles`.
  8. **`travel-and-stays` or `property` for `stays`.** Folders move freely, so this costs nothing either way.
  9. Still open from before: `check.sh` doesn't check that every file is listed in `directory.md` (all 57 are, checked by a scratch script this session); no check runs on pull requests; how a change to an existing file is merged; which three markets launch first.
