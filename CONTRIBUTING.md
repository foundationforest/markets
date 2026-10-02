# Proposing a market

Anyone may propose a market, or a change to one. You need git, Node 22 and npm. The foundation
reviews and merges pull requests, and `./check.sh` must pass first.

## 1. Before you write a file

1. **Check [`directory.md`](directory.md).** If a market already covers this kind of dealing, use
   it. If its file is missing something, propose a change to that file instead (see the end).
2. **Is it a market?** A market is a context where strangers meet and accountability matters, and
   each deal has a start and an end. Money usually moves, but doesn't have to: finding tennis
   partners is a market.
3. **One market or two?** Two kinds of dealing are two markets when reputation in one says nothing
   about the other.
   - Car sales and car rental: two markets.
   - Online and in-person tutoring: one market. Where it happens is a field on the offer.
   - Phones and laptops: one market, `electronics`. An honest phone seller is an honest laptop
     seller.

## 2. Write the file

Create `<folder>/<name>.json`, with these keys in this order. Nothing else may be in the file.

| Key | Needed | What it holds |
|---|---|---|
| `name` | yes | The market's spelling: lowercase letters and digits, words joined by single hyphens, at most 64 characters. No other market may have it. |
| `folder` | yes | The folder the file sits in, written the same way. Use one from `directory.md`, or start a new one. |
| `description` | yes | What the market is: one line, at most 300 characters. |
| `sides` | yes | `"two"`, a seller and a buyer, or `"one"`, peers. |
| `roleNames` | no | Two-sided markets only: `{ "seller": "...", "buyer": "..." }`, each one line of at most 64 characters. Only when seller and buyer aren't the natural words, as with host and guest. |
| `evidenceTypes` | yes | Slugs, each once: `["escrow"]` where money usually moves through an escrow, `[]` for none. |
| `offerFields` | yes | `{ "properties": { ... } }`, the fields an offer here usually carries, or `{}` for none. |
| `reviewFields` | no | The same shape, for fields a review here may carry. Every file so far has `{}`. |
| `ratings` | yes | camelCase names, each once, `"overall"` first. |
| `howDealsGo` | yes | Plain text, at most 3000 characters. |

[`home/plumbing.json`](home/plumbing.json) and [`education/tutoring.json`](education/tutoring.json)
are good models. [`schema/market.json`](schema/market.json) is the exact format.

### The name

Pick the name you'd still use in twenty years. A profile's label holds the name as text, and a line
on the registry never changes, so renaming a market here leaves every existing profile under the
old name.

Avoid a name that could mean another trade: `pet-training`, not `training`; `event-security`, not
`security`.

### Offer and review fields

Each field is a camelCase name (a lowercase letter, then letters and digits) and a definition in AT
Protocol lexicon field syntax:

- `type`: `string`, `integer`, `boolean`, or `array` with `items` of one of those three. Nothing
  nested: anything structured would be a new record shape, and a market adds fields, never shapes.
- `description`: what the field is, in one sentence.
- Limits, by type:
  - string: `maxLength`, `minLength`, `maxGraphemes`, `minGraphemes`, `knownValues`, `enum`,
    `const`, `default`, and `format`: one of `datetime`, `uri`, `at-uri`, `did`, `handle`,
    `at-identifier`, `nsid`, `cid`, `language`, `tid`, `record-key`;
  - integer: `minimum`, `maximum`, `enum`, `const`, `default`;
  - boolean: `const`, `default`;
  - array: `items`, and `minLength` and `maxLength`, which count items.

A field can't reuse a name the base record already has:

- an offer has `direction`, `description`, `price`, `terms`, `availability`, `remote`, `location`,
  `expires`, `createdAt`;
- a review has `subject`, `ratings`, `text`, `media`, `dealId`, `createdAt`.

So the fields stay suggestions:

- **Reuse before you invent.** If another market has a field that means the same thing
  (`condition`, `deliveryDays`, `languages`), copy its definition exactly. Every field here has one
  definition across all files, so an app can treat it alike everywhere.
- **`knownValues`, not `enum`.** Known values suggest words; `enum` refuses any other.
- **No `required`.** A block holds only `properties`. Every field is a suggestion, so `check.sh`
  refuses a list of required fields.

### Ratings

`overall` first, then the few things people in this market most often judge: `punctuality` for a
visit, `accuracy` for goods described online, `cleanliness` for a stay.

### How deals go

A short paragraph, in plain words:

- what done looks like;
- which escrow options people here tend to turn on, and why;
- what a buyer should check before paying.

Forest's escrow holds money until both sides agree. Its options are off unless the offer turns them
on: an arbiter, who may decide any split, and a timer, which after a set number of days pays
everything to one named side.

No amounts of money or time: no prices, no number of days. The people in a deal set those, offer by
offer.

## 3. Add its line to the directory

Add one line under its folder in [`directory.md`](directory.md), in the shape indexes read:

```
- [`name`](folder/name.json): The description. Two-sided.
```

End it the way the other lines do: `Two-sided.`, `One-sided.`, or `Two-sided: host and guest.` when
the file has `roleNames`. A new folder gets a `## folder` heading and one sentence on what's in it.

The foundation's index reads only markets that have a line here. `check.sh` fails a file with no
line, and a line that points at no market file.

## 4. Check, then open a pull request

```
./check.sh
```

Fix whatever it prints, until it says every file passes. Then open a pull request with the file and
its line. The pull request runs `check.sh` again. Once it passes, the foundation reviews the pull
request and merges it.

## Changing a market

The same way: edit the file, run `./check.sh`, open a pull request.

- **Adding or rewording** a field, a rating name or the text is an ordinary change.
- **Moving** a market to another folder is free: change `folder`, move the file, and update its line
  in `directory.md`.
- **Renaming** makes a new market. Profiles keep the old name, and the foundation's index stops
  counting them once the old name leaves `directory.md`. So add the new file next to the old one,
  rather than renaming the old one.
