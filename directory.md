# Directory

The standard market names, by category. Only a name listed here, with its file in this repo, counts in indexes and badges. Anyone can write a market file anywhere else; it carries no weight.

- **A market** is a trade or a kind of thing inside a category: plumbing, tutoring, phones. A badge is per market: one person holds at most one badge in each.
- **A category** is a deal shape: how money, time and evidence flow. Here a category is a folder and a page (its section below). It is never a program concept: the escrow has one shape for every category, and no code reads a category.
- **Suggested values** are starting terms an app offers a seller writing an offer. The seller changes any of them, per offer, and nothing checks a deal against them. [`template.md`](template.md) explains each one.
- **The words live here.** A market file holds exactly seven keys and nothing else, so each market's description and the reason behind each suggested value are on this page, not in the file.

Every market below is a **draft: first three to be chosen with real sellers**. Names, fields and values can change until then. A name is hard to change once badges exist under it.

## home-services: a visit

The seller comes to the buyer. The buyer pays when booking, and the money waits in escrow. The service time is the appointment, and the clock runs from the visit. After the work the buyer approves and the seller is paid; if the buyer does nothing, auto-release pays the seller a set number of days after the visit, unless the buyer has objected. Before the visit the buyer can cancel, for a refund that shrinks as the visit gets closer. The evidence is the escrow receipt.

| Suggested | Why |
| --- | --- |
| Auto-release after 2 days | The buyer sees the work at the visit. Two days leaves time for a fault that shows the next day, and still pays the seller soon. |
| Cancel 24 hours or more before the visit: 100% back | A day's notice leaves the seller time to fill the slot. |
| Cancel later, before the visit starts: 50% back | A late cancellation costs the seller the slot, so the loss is shared. |
| No cancelling alone once the visit starts | The work is under way. A problem goes through an objection. |
| Post field `appointmentWindowHours` | A visit needs someone home. This says how wide the arrival window is. |

| Market | File | What it is | Status |
| --- | --- | --- | --- |
| `plumbing` | [home-services/plumbing.json](home-services/plumbing.json) | Pipes, taps, drains, toilets and water heaters: fixing and fitting. | draft: first three to be chosen with real sellers |
| `electrical` | [home-services/electrical.json](home-services/electrical.json) | Wiring, sockets, lights and fuse boxes: fixing and fitting. | draft: first three to be chosen with real sellers |
| `cleaning` | [home-services/cleaning.json](home-services/cleaning.json) | Cleaning a home, once or on a schedule. | draft: first three to be chosen with real sellers |
| `gardening` | [home-services/gardening.json](home-services/gardening.json) | Mowing, pruning, planting and clearing a garden or yard. | draft: first three to be chosen with real sellers |
| `handyman` | [home-services/handyman.json](home-services/handyman.json) | Small repairs and jobs around a home: shelves, doors, putting furniture together. | draft: first three to be chosen with real sellers |
| `moving` | [home-services/moving.json](home-services/moving.json) | Moving a home's things from one place to another, with or without packing. | draft: first three to be chosen with real sellers |

## freelance-work: a deliverable

The seller makes something and hands it over, often from a distance. The buyer pays at the start, and the money waits in escrow for the thing to be delivered. The service time is the due date. Delivered early, the buyer approves and the seller is paid at once. Otherwise auto-release pays the seller a set number of days after the due date, unless the buyer has objected. The evidence is the escrow receipt.

| Suggested | Why |
| --- | --- |
| Auto-release 7 days after the due date | A deliverable takes time to check: a week to read it, watch it or run it. |
| No cancellation steps | Until the seller accepts, the buyer can withdraw everything. Once the seller accepts, work starts, so a buyer who wants out objects: then the two agree a split, or the arbiter decides, or the seller gives the money back. |
| Post field `deliveryDays` | The due date is the service time. An offer is used for many deals, so it says how many days, and the app turns that into a date when a deal starts. |
| `tutoring` only: post fields `subjects` and `languages` | Carried over from forest's worked example: what is taught, and in which languages. Tutoring has no `deliveryDays`: a session has a time, not a due date. |

| Market | File | What it is | Status |
| --- | --- | --- | --- |
| `tutoring` | [freelance-work/tutoring.json](freelance-work/tutoring.json) | Lessons in any subject, one session at a time. | draft: first three to be chosen with real sellers |
| `design` | [freelance-work/design.json](freelance-work/design.json) | Logos, graphics, layouts and other visual design, delivered as files. | draft: first three to be chosen with real sellers |
| `video-editing` | [freelance-work/video-editing.json](freelance-work/video-editing.json) | Cutting and finishing video from the buyer's footage. | draft: first three to be chosen with real sellers |
| `writing` | [freelance-work/writing.json](freelance-work/writing.json) | Articles, copy and other text, written to order. | draft: first three to be chosen with real sellers |
| `translation` | [freelance-work/translation.json](freelance-work/translation.json) | Text translated from one language to another. | draft: first three to be chosen with real sellers |
| `software` | [freelance-work/software.json](freelance-work/software.json) | Code written to order: apps, sites, scripts and fixes. | draft: first three to be chosen with real sellers |

## buy-and-sell: a handover or a shipment

The seller sells a thing. The buyer pays, and the money waits in escrow for the thing to change hands. The service time is the meeting, or the expected delivery when the thing is shipped. The buyer confirms at the handover and the seller is paid; auto-release is only the fallback if the buyer forgets. The evidence is the escrow receipt. Shipment tracking is a later evidence type.

| Suggested | Why |
| --- | --- |
| Auto-release after 1 day | The buyer confirms at the handover, so auto-release is only a fallback. One day is the least an escrow holds. |
| No cancellation steps | Until the seller accepts, the buyer can withdraw everything. A seller who ships accepts before shipping, since a shipped thing can't be un-sent. |
| Post field `condition` | Used things sell on their condition. It suggests new, like-new, good, fair and for-parts; any other word passes. |
| Post field `ships` | Says whether the service time is a meeting or an expected delivery. |

| Market | File | What it is | Status |
| --- | --- | --- | --- |
| `phones` | [buy-and-sell/phones.json](buy-and-sell/phones.json) | Phones, new or used. | draft: first three to be chosen with real sellers |
| `computers` | [buy-and-sell/computers.json](buy-and-sell/computers.json) | Laptops, desktops, tablets and their parts. | draft: first three to be chosen with real sellers |
| `furniture` | [buy-and-sell/furniture.json](buy-and-sell/furniture.json) | Tables, chairs, beds, shelves and the like. | draft: first three to be chosen with real sellers |
| `bikes` | [buy-and-sell/bikes.json](buy-and-sell/bikes.json) | Bicycles, electric bikes and their parts. | draft: first three to be chosen with real sellers |
| `clothing` | [buy-and-sell/clothing.json](buy-and-sell/clothing.json) | Clothes, shoes and accessories. | draft: first three to be chosen with real sellers |
| `tools` | [buy-and-sell/tools.json](buy-and-sell/tools.json) | Hand tools, power tools and garden tools. | draft: first three to be chosen with real sellers |

## Fields one market needs

Every file in a category has the same fields, except `tutoring`. Fields a single market needs, such as the two languages for `translation` or sizes for `clothing`, are for that market's sellers to propose.
