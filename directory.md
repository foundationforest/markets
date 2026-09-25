# Directory

The spellings the foundation recommends for Forest markets, so one trade doesn't split into ten names, grouped in categories for reading.

- Anyone can make any market, under any name. Nothing here allows, forbids or approves anything.
- A category is a folder here and a heading on this page. It changes nothing about how a deal works.
- Each market's file says what the trade is and which extra fields an offer in it usually carries. Money, time, the arbiter and the timer are the seller's, per offer; nothing here suggests them.

## home-services

The seller comes to the buyer's home to do a job. The two agree on the job and a time for the visit, and the buyer usually pays into escrow when booking. After the visit the buyer releases the money to the seller. If the visit doesn't happen, the seller releases it back. If the job went only partly right, the two agree a split, or an arbiter decides if the offer named one.

- [`plumbing`](home-services/plumbing.json): Pipes, taps, drains, toilets and water heaters: fixing and fitting.
- [`electrical`](home-services/electrical.json): Wiring, sockets, lights and fuse boxes: fixing and fitting.
- [`cleaning`](home-services/cleaning.json): Cleaning a home, once or on a schedule.
- [`gardening`](home-services/gardening.json): Mowing, pruning, planting and clearing a garden or yard.
- [`handyman`](home-services/handyman.json): Small repairs and jobs around a home: shelves, doors, putting furniture together.
- [`moving`](home-services/moving.json): Moving a home's things from one place to another, with or without packing.

## freelance-work

The seller does work for the buyer, usually from a distance, and hands over the result: files, text, code, or a lesson. The buyer pays into escrow at the start and releases the money once the work arrives and is what was asked. A big job is often split into parts, each paid and released on its own. If the work never comes, the seller releases the money back; if it comes but falls short, the two agree a split.

- [`tutoring`](freelance-work/tutoring.json): Lessons in any subject, one session at a time.
- [`design`](freelance-work/design.json): Logos, graphics, layouts and other visual design, delivered as files.
- [`video-editing`](freelance-work/video-editing.json): Cutting and finishing video from the buyer's footage.
- [`writing`](freelance-work/writing.json): Articles, copy and other text, written to order.
- [`translation`](freelance-work/translation.json): Text translated from one language to another.
- [`software`](freelance-work/software.json): Code written to order: apps, sites, scripts and fixes.

## buy-and-sell

The seller sells a thing, new or used. The buyer pays into escrow, and the thing changes hands at a meeting or is shipped. At a meeting the buyer looks it over and releases the money on the spot; a shipped thing is released when it arrives. If the thing isn't as described, it goes back and the seller releases the money back, or the two agree a split.

- [`phones`](buy-and-sell/phones.json): Phones, new or used.
- [`computers`](buy-and-sell/computers.json): Laptops, desktops, tablets and their parts.
- [`furniture`](buy-and-sell/furniture.json): Tables, chairs, beds, shelves and the like.
- [`bikes`](buy-and-sell/bikes.json): Bicycles, electric bikes and their parts.
- [`clothing`](buy-and-sell/clothing.json): Clothes, shoes and accessories.
- [`tools`](buy-and-sell/tools.json): Hand tools, power tools and garden tools.

## Scopes

The recommended badge scope is `market:role`, for example `plumbing:seller` and `plumbing:buyer`. That way a person can hold one profile per side of a market: one that sells plumbing work and one that buys it.

- The roles are the ones the market's file names. Every file here names `seller` and `buyer`.
- Market names and roles are slugs, so neither ever holds a colon: the first colon always splits the two.
- The registry accepts any scope. This is a recommendation.

## Aliases

Other common spellings of each market, so indexes can group them. An alias is not a separate market here: no file here may take an alias as its name, and `check.sh` refuses one that does. Anyone can still post under an alias; how an index groups them is its own call.

Each row is one market, then its aliases, each in backticks. `check.sh` reads this table.

| Market | Aliases |
| --- | --- |
| `plumbing` | `plumber`, `plumbers`, `plumbing-repair` |
| `electrical` | `electrician`, `electricians`, `electrical-work` |
| `cleaning` | `cleaner`, `cleaners`, `house-cleaning`, `home-cleaning` |
| `gardening` | `gardener`, `gardeners`, `garden-care`, `lawn-care`, `yard-work` |
| `handyman` | `handymen`, `handyperson`, `odd-jobs` |
| `moving` | `mover`, `movers`, `removals`, `house-moving` |
| `tutoring` | `tutor`, `tutors`, `online-tutors`, `online-tutoring` |
| `design` | `designer`, `graphic-design`, `logo-design` |
| `video-editing` | `video-editor`, `video-editors`, `video-editing-services` |
| `writing` | `writer`, `writers`, `copywriting`, `content-writing` |
| `translation` | `translator`, `translators`, `translations` |
| `software` | `software-development`, `programming`, `coding`, `developer` |
| `phones` | `used-phones`, `mobile-phones`, `cell-phones`, `smartphones` |
| `computers` | `laptops`, `used-computers`, `pcs` |
| `furniture` | `used-furniture`, `second-hand-furniture` |
| `bikes` | `bike`, `bicycle`, `bicycles`, `used-bikes` |
| `clothing` | `clothes`, `used-clothing`, `apparel` |
| `tools` | `used-tools`, `power-tools`, `hand-tools` |
