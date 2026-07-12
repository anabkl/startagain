# Google Merchant Center Readiness — parapharmacie.me

Audit date: 2026-07-12. No feed is generated or submitted by this repository today, and this document does not create one. It records what is verified, what is missing, and what must be resolved before any product feed is built.

## Why no feed exists yet

A Merchant Center product feed requires, at minimum, a stable product URL, title, description, price/currency, availability from a trustworthy source, a real product image, and (for most categories) GTIN/MPN or an explicit `identifier_exists: false`. Two of these are currently unverifiable for the entire 93-product catalogue:

- **No GTIN/MPN/EAN field exists anywhere.** Neither the marshmallow `ProductSchema` (`backend/app/schemas/product.py`) nor the pydantic `ProductInput` validator (`backend/app/validators/product.py`) has a barcode/identifier field. Submitting a feed without `identifier_exists: false` set correctly would misrepresent every listing.
- **No real per-product photography exists.** Every one of the 93 catalogue products falls back to one of 12 generic category illustrations (`assets/products/category-fallback-*.webp`) or the placeholder SVG — confirmed via `imageNeedsReview: true` on every entry (`js/catalog-data.js`, enforced by `scripts/validate-catalog.mjs`). Google requires genuine product packshots; category illustrations are explicitly disallowed as product images.

Per the sprint's business-truth rule, these gaps are reported here rather than worked around with placeholder or inferred values. **No products should be submitted to Merchant Center until both are resolved.**

## What is already present and verified

| Requirement | Status | Evidence |
|---|---|---|
| Stable canonical product URL | ✅ | `/produits/<slug>/`, one per product, enforced by `scripts/validate-seo.mjs` |
| Product title | ✅ | Present on every product page (`<h1>`, `Product.name` in JSON-LD) |
| Brand | ⚠️ Partial | `brand` is a free-text field on most catalogue entries, but not every entry has been checked against the manufacturer's registered brand name |
| Description | ✅ | Auto-generated per product from name/brand/category/format; no fabricated claims |
| Price + currency (MAD) | ✅ | `Product.offers.price` / `priceCurrency: "MAD"` in JSON-LD on every product page |
| Structured data (`Product`/`Offer`/`Brand`) | ✅ | Present and CI-gated (`validate-seo.mjs`) |
| `availability` in structured data | ✅ correctly omitted | `validate-seo.mjs` fails the build if `availability` appears anywhere — stock is not verified, so no availability claim is made (see Roadmap in `README.md`) |
| Returns-policy link | ⚠️ Exists, not yet indexable | `/retours-remboursements/` is built this sprint but stays `noindex` and out of the sitemap until the pharmacy confirms the policy fields in `js/returns-policy-data.js` |
| Shipping information | ❌ Missing | `/livraison/` states delivery fees, times, and coverage are "à confirmer" — no shipping settings can be configured in Merchant Center from this |
| Contact information | ✅ | Phone, WhatsApp, email published on `/contact/` |
| Terms / privacy pages | ✅ | `/conditions-utilisation/`, `/confidentialite/` |
| GTIN / MPN | ❌ Missing | No field in either backend schema (see above) |
| Real product images | ❌ Missing | 100% generic fallbacks (see above) |
| Verified availability/inventory | ❌ Unverified | Backend `stock` is a seeded integer, not reconciled inventory (`backend/app/services/product_service.py`) |

## Healthcare / restricted-category note

Google Merchant Center restricts or prohibits certain healthcare-adjacent product categories, and eligibility varies by country including Morocco. Several catalogue categories (`sante`, `para-medical`, `complements-alimentaires`) sit in or near these restricted categories. **Before any submission, each affected category must be individually checked against Google's current healthcare content policy for the target country** — this has not been done as part of this sprint and is out of scope for a code change. Do not submit these categories by default.

## Readiness checklist for a future sprint

1. Add a `gtin`/`mpn` field to `ProductInput`/`ProductSchema` and backfill it per product from manufacturer data (or explicitly mark `identifier_exists: false` where no code exists, per Google's own allowance for generic products).
2. Commission or source real packshots for each product actually being submitted; do not submit products still flagged `imageNeedsReview: true`.
3. Get the pharmacy owner to confirm real shipping fees/times/coverage and returns-policy fields (`js/returns-policy-data.js`), then flip `RETURNS_ROUTE` into the sitemap.
4. Connect a real inventory source (or a manually-reviewed stock list) before setting `availability` in structured data or a feed — never default to `in stock`.
5. Review each catalogue category against Google's healthcare/restricted-category policy for Morocco; exclude anything not explicitly cleared.
6. Only then build a feed generator (e.g. `scripts/generate-merchant-feed.mjs`) that reads exclusively from verified fields and skips any product missing a required attribute, logging what was excluded and why.
