# Markets: how they work and how to add one (version 1)

Context, not control. This guide will keep evolving.

## What a market is

A market is a context where strangers meet and accountability matters. Money usually moves there; it doesn't have to. Plumbing is a market. Tennis partners is a market. A person holds one profile per market and side, tied to one real human, and that profile's record follows them forever in that market.

## How a profile is named

A profile's badge is made from the person's secret and a scope: `market/role`.

- **market**: one word or a hyphenated few, lowercase, unique across the whole directory: `plumbing`, `video-editing`, `car-rental`.
- **role**: a market is two-sided or one-sided. Two-sided markets use the words `seller` and `buyer`. One-sided markets use `peer`. These three words are fixed forever; a market file may give plainer labels for people to see (stays: host and guest; media: creator and viewer).

Examples: `plumbing/seller`, `electronics/buyer`, `tennis/peer`.

A market's name is frozen the day the first badge exists in it. To change one, open a new market; the old one stays with its badges, and indexes show one as the continuation of the other. Folders are not in the badge, so they can be reorganized any time.

## Folders

Folders exist so people and AIs can find a market. They say what a deal is about. Version 1: home, vehicles, property, electronics, fashion, education, health-and-beauty, food, events, travel-and-stays, transport, business, creative-and-digital, media, pets, sports, community. More whenever needed.

## The one rule for a new market

**Two kinds of dealing are two markets when reputation in one says nothing about the other.**

- Car sales and car rental: two markets.
- Online tutoring and in-person tutoring: one market; where it happens is a field on the offer.
- Phones and laptops: one market, `electronics`; an honest phone seller is an honest laptop seller.

## What a market file says

- name, folder, one-line description
- sides: two or one; labels when the market has better words than seller and buyer
- evidence types that apply (the escrow receipt for anything with money; title, tracking, check-in later)
- the fields an offer here usually carries (appointment window, delivery days, condition, ships, dates)
- the fields a review here may carry beyond the standard (a match result, later)
- the rating names commonly used (overall always; a hotel adds location and cleanliness; a plumber adds punctuality)
- how deals here usually go, in plain words: what done looks like, which escrow options people here tend to turn on and why, what a buyer should check before paying

A market file never sets money or time values. It suggests; the people in the deal decide.

## Reviews

One shape everywhere. Who it's about; the deal it was about (optional); ratings, each a number 1.0 to 10.0 with one decimal, `overall` by convention; text; photos or short video. A market may add fields, the way it adds fields to offers. A review sits on a profile that lives in one market, so the market is known.

A profile shows two things, never blended: its rating (the quality people report, weighted by what backs each review) and its standing (verified deals, who vouched, how credible the reviewers are).

## Escrow, in this design

Money goes in, and comes out only when both sides agree. Options, off by default, chosen when the escrow is made: an arbiter, a timer. That's the whole program.

Everything other escrows bolt on lives outside it here, because the enforcer is the permanent record and two reputations at stake:
- an inspection period is simply the time before you release;
- "delivered" is a claim the seller writes in their own folder, timestamped; the buyer's silence after it is visible to every index;
- milestones are several escrows; the app groups them;
- a deposit or hold is an escrow released back;
- mediation is the arbiter, when both want one.

Stuck money hurts both sides, and both records show it. A market's "how deals here usually go" is where it says which options people tend to turn on.

## Location

An offer may carry a point (coordinates rounded to the precision the seller chooses, about 1 km by default) and an area name. Indexes answer "within 5 km." Being found by distance means revealing that much, and you set how much.

## Proving your reputation across markets

Later, in the foundation: two proofs a person makes about their own profiles, never naming one. A chosen set ("I hold badges in five markets with these ratings") or everything ("and there is nothing else"). Indexes and apps check them. Until they exist, profiles are simply separate.

## How to add a market

1. Check the directory. If a market already covers this dealing, use it, and add a field to its offers if something is missing.
2. Is it a context where strangers meet and accountability matters, with a start and an end to each interaction? If not, it isn't a market here.
3. Apply the one rule: would reputation from an existing market carry over? If yes, it's the same market.
4. Name it: lowercase, unique, the name you'd still use in twenty years.
5. Two-sided or one-sided? Give labels only if seller and buyer aren't the natural words.
6. Which evidence can prove a deal happened, even evidence that doesn't exist yet?
7. What do people rate? Name the ratings.
8. Write "how deals here usually go" in plain words.
9. Pick a folder. Folders can move; the name can't.
10. Open a pull request with the file. It's merged when it validates and the name isn't taken. No other test.

## Examples (version 1)

| Folder | Markets |
|---|---|
| home | plumbing, electrical, cleaning, gardening, handyman, moving, painting |
| vehicles | cars, motorcycles, car-rental, bikes |
| property | property-sales, property-rentals, venues |
| travel-and-stays | stays (host, guest) |
| electronics | electronics, appliances |
| fashion | clothing, shoes, accessories |
| education | tutoring, courses, music-lessons |
| creative-and-digital | design, video-editing, coding, writing, translation, photography |
| media | photos, videos, films, short-form, news (creator, viewer; free or paid) |
| business | consulting, accounting, legal-advice |
| food | private-chef, catering, meals |
| transport | rides, deliveries, freight, chauffeur |
| events | tickets, experiences, event-staff, event-security |
| health-and-beauty | hairdressing, massage, personal-training |
| pets | pet-sitting, grooming, pet-training |
| sports | tennis (one-sided), running-partners (one-sided) |
| community | study-partners (one-sided) |

## Foundation versus apps

| The foundation, now | The foundation, later | Apps |
|---|---|---|
| registry, escrow, shapes, keys, host, carrier, index, issuer, this directory | proof circuits, cards for AI chats (MCP Apps), distance search, more evidence types | chat, ramps, pools, proof buttons, milestone grouping, review nudges |
