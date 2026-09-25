# The market file

A market file is a small JSON file. It names a market, puts it in a category, says in one line what the trade is, and adds the extra fields an offer in it usually carries. It says nothing about money or time, and it restricts no deal.

This page puts the validator's rules into words. The validator lives in `forest/shapes` ([`src/validate.js`](https://github.com/foundationforest/forest/blob/main/shapes/src/validate.js), where `MARKET_REQUIRED_KEYS` and `MARKET_KEYS` list the keys). If this page and the validator ever disagree, the validator is right. `./check.sh` runs it on every file here.

A market file has five required keys and two optional ones:

- Required: `name`, `category`, `fields`, `evidenceTypes`, `credentialIssuers`
- Optional: `description`, `roles`

Any other key fails.

Here is [`home-services/plumbing.json`](home-services/plumbing.json):

```json
{
  "name": "plumbing",
  "category": "home-services",
  "description": "Pipes, taps, drains, toilets and water heaters: fixing and fitting.",
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
  "credentialIssuers": []
}
```

## `name` (required)

The market's spelling. A post names its market with it.

- A lowercase slug: letters, digits and single hyphens between them, at most 64 characters.
- In this repo the file lives at `<category>/<name>.json`, no two files share a name, and no file takes a name listed as an alias in [`directory.md`](directory.md#aliases). `check.sh` checks all three.

## `category` (required)

Groups markets for reading.

- A lowercase slug, at most 64 characters. Any slug passes: a new category is a new folder, not code.
- It must match the folder the file is in. This repo has three: `home-services`, `freelance-work`, `buy-and-sell`.

## `description` (optional)

What the trade is, in one line.

- One line of text, not blank, at most 300 characters.
- Every file here has one, and `directory.md` shows it.

## `roles` (optional)

The sides a post in this market can take.

- A list of at least one lowercase slug, each at most 64 characters, none twice.
- Left out, the roles are `seller` and `buyer`. Every file here writes them out anyway.
- A post's `role` must be one of them; the validator checks it.
- The recommended badge scope is `market:role`, such as `plumbing:seller` (see [`directory.md`](directory.md#scopes)).

## `fields` (required)

The extra fields an offer, profile or review in this market usually carries.

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

The fields used here:

- `home-services`: `appointmentWindowHours`, how wide the arrival window is.
- `freelance-work`: `deliveryDays`, days from the start of the deal to delivery. `tutoring` has `subjects` and `languages` instead.
- `buy-and-sell`: `condition` (it suggests new, like-new, good, fair and for-parts, and any other word passes) and `ships`.

## `evidenceTypes` (required)

The evidence that applies to deals in this market.

- A list of lowercase slugs, none twice. An empty list means none.
- The one type defined so far is `escrow`: the escrow's permanent receipt. Every file here lists it.
- It is information for indexes, which weigh a deal by the evidence under it. It never makes a record invalid: evidence weighs, it never rejects.

## `credentialIssuers` (required)

The credential issuers this market recognizes.

- A list of DIDs. Empty until issuers exist.
- Every file here has an empty list.

## What a market file never says

- **Nothing about money or time.** The price, the token, the arbiter and the timer are in the seller's post, set per offer.
- **Nothing that limits a deal.** With a market file, the validator checks a post for three things only: it uses the market's name, it uses one of the market's roles, and its extra fields fit their definitions.
