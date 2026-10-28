# Same Day Groceries

A private, voice-first grocery assistant that remembers preferred products and prepares a same-day Walmart shopping list for final review.

## What it does

- Accepts a spoken or typed grocery list.
- Remembers exact product names, sizes, usual quantities, Walmart links, and substitution rules in browser storage.
- Matches future requests such as “milk” or “bread” to saved preferences.
- Opens the matched list at Walmart for product, availability, delivery-time, and payment approval.

## Important limitation

Walmart does not provide a public consumer checkout API. This app therefore cannot securely submit or pay for a Walmart order automatically. Final checkout remains on Walmart.

## Run locally

Serve the files in `dist/` with any static web server. For example:

```bash
npx serve dist
```

Voice input works in browsers that support the Web Speech API.
