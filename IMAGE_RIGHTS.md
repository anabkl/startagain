# Product Image Rights Workflow

parapharmacie.me does not reuse competitor product photos unless rights are clearly granted.

## Current Status

- Product image folder: `assets/products/`
- Active fallback image: `assets/products/product-placeholder.svg`
- Catalog image policy: every product currently uses the local placeholder and has `imageNeedsReview: true`.
- No third-party product photos have been downloaded or committed.
- No remote product images are used in the current local catalog.

## Before Production

1. Replace placeholders with product photos owned by Pharmacie Tawfiq, supplied by brands/distributors, or licensed for commercial reuse.
2. Export approved product photos as optimized `.webp` files.
3. Store them in `assets/products/` with stable names matching product slugs.
4. Update each product `image` field to the approved `.webp` path.
5. Change `imageNeedsReview` to `false` only after the image source and usage rights are documented.
6. Keep `sourceUrl` for product data provenance separate from image rights provenance.

## Safe Image Sources

- Original photos produced by Pharmacie Tawfiq/parapharmacie.me.
- Brand or distributor assets with written approval for e-commerce use.
- Public-domain or explicitly commercial-use licensed assets, with license notes retained.

## Needs Review

- Product photos from Moroccan competitor websites.
- Marketplace images from retailers, aggregators, or search results.
- Brand images without written usage terms.
- Remote image URLs used temporarily during merchandising.

## Production Checklist

- `npm run validate:catalog` passes.
- Every production image is a local `.webp` file unless a documented CDN workflow exists.
- Every `imageNeedsReview: false` product has a known image owner or license.
- No broken image paths in desktop or mobile storefront previews.
