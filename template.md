# The market file

A market file is a small JSON file. It names a market, says which deal shape the market follows, adds a few fields to its records, and suggests starting terms for offers. It restricts no deal.

This page puts the validator's rules into words. The validator lives in `forest/shapes` ([`src/validate.js`](https://github.com/foundationforest/forest/blob/main/shapes/src/validate.js), where `MARKET_KEYS` lists the keys). If this page and the validator ever disagree, the validator is right. `./check.sh` runs it on every file here.

A market file has **exactly seven keys**, no more and no fewer:

`name`, `category`, `roles`, `fields`, `evidenceTypes`, `suggested`, `credentialIssuers`

Any other key fails, a description or a comment included. That is why each market's description and the reasons behind its values are in [`directory.md`](directory.md).

Here is [`home-services/plumbing.json`](home-services/plumbing.json):

```json
{
  "name": "plumbing",
  "category": "home-services",
  "roles": ["seller", "buyer"],
  "fields": {
    "post": {
      "properties": {
        "appointmentWindowHours": {
          "type": "integer",
          "description": "How wide the arrival window is, in hours: the seller arrives within this many hours of the booked time.",
          "minimum": 0
        }
      }
    }
  },
  "evidenceTypes": ["escrow"],
  "suggested": {
    "autoReleaseDays": 2,
    "cancellationSteps": [
      { "hours": -24, "refundPercent": 100 },
      { "hours": 0, "refundPercent": 50 }
    ]
  },
  "credentialIssuers": []
}
```

## `name`

The market's standard name. A post names its market with it, and a badge is per name.

- A lowercase slug: letters, digits and single hyphens between them, at most 64 characters.
- In this repo the file lives at `<category>/<name>.json`, and no two files share a name. `check.sh` checks both.

## `category`

The deal shape: how money, time and evidence flow.

- A lowercase slug, at most 64 characters. The validator accepts any slug, because a new category is a file, not code.
- This repo has three: `home-services`, `freelance-work`, `buy-and-sell`. The category must match the folder the file is in.

## `roles`

Who takes part in a deal.

- A list of at least one lowercase slug, each at most 64 characters, none twice.
- A post's `role` must be one of them; the validator checks it.
- Every file here uses `seller` and `buyer`.

## `fields`

Extra fields for this market's records.

- An object keyed by the shape the fields go on: `profile`, `post` or `review`. Never `credential`, since a credential belongs to its issuer. Never a new shape.
- Each is `{ "properties": { ... }, "required": [ ... ] }`, and `required` may be left out. `{}` means no extra fields.
- A field's name is camelCase: a lowercase letter first, then letters and digits.
- A field's type is `string`, `integer`, `boolean`, or an `array` of one of those. Nothing nested: anything with structure would be a new shape.
- Fields use AT Protocol lexicon syntax, so they can carry its usual limits and hints, such as `description`, `maxLength`, `minimum`, `format` and `knownValues`. The result must still be a valid lexicon.
- A field can't reuse a base field's name:
  - profile: `name`, `photo`, `contact`, `about`, `wallet`, `createdAt`
  - post: `direction`, `market`, `role`, `description`, `price`, `terms`, `availability`, `remote`, `location`, `expires`, `createdAt`
  - review: `subject`, `rating`, `text`, `dealId`, `createdAt`
- `required` may name only that block's own fields. A required field makes a post without it invalid in this market, so no file here marks any field required.
- Records are open: a record may carry fields no market declares, and they pass.

## `evidenceTypes`

The evidence that applies to deals in this market.

- A list of lowercase slugs, none twice. An empty list means none.
- The one type defined so far is `escrow`: the escrow's permanent receipt. Every file here lists it.
- It is information for indexes, which weigh a deal by the evidence under it. It never makes a record invalid: evidence weighs, it never rejects.

## `suggested`

**Suggestions only.** These are starting values for an offer's terms. An app shows them to a seller writing an offer, and the seller changes any of them. Nothing checks a deal against them.

Exactly two keys:

- `autoReleaseDays`: a whole number of days, 1 to 65,535. After the clock starts, the money goes to the seller once this many days pass, unless the buyer has objected.
- `cancellationSteps`: a list of up to four steps, each exactly `{ "hours": ..., "refundPercent": ... }`. Before a step's deadline the buyer can cancel alone and get at least that percent back.
  - `hours` is a whole number of hours from the clock start. Negative means before the service time.
  - `refundPercent` is a whole percent, 0 to 100.
  - Deadlines must strictly rise.
  - No deadline may be later than auto-release (the days times 24 hours), or the buyer's cancelling and the seller's payout would race.
  - An empty list means no steps: once the seller accepts, the buyer can't cancel alone.

The clock starts at the latest of the service time, the moment the money arrives, and the seller's acceptance. The validator holds suggested values to the same rules an escrow holds, so a suggestion can always become a real offer's terms.

## `credentialIssuers`

The credential issuers this market recognizes.

- A list of DIDs. Empty until issuers exist.
- Every file here has an empty list.

## What a market file never does

Nothing in a market file limits a deal.

- **The arbiter is always available.** Any offer may name one.
- **Any accepted token works.** The post names its token, and which tokens an index counts is the index's call.
- **The seller sets the terms per offer.** The auto-release days, the cancellation steps and the arbiter are in the post, not here.

No code enforces a market file's values on a deal. With a market file, the validator checks a post for three things only: it uses the market's name, it uses one of the market's roles, and its extra fields fit their definitions.
