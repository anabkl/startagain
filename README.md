# parapharmacie.me

Moroccan parapharmacy storefront for **parapharmacie.me**, built as a static-first catalogue with a Render API for accounts, catalogue reconciliation, and orders.

## Project Overview

The public catalogue uses descriptive local slugs as its canonical product identity. API records are reconciled to those slugs by exact normalized product name, while the API identifier is retained for order submission. If the API is unavailable, the same 93-reference local catalogue keeps the storefront usable.

## Features

- Responsive homepage with crawlable categories, factual catalogue signals, FAQ, and trust links.
- Searchable/filterable shop catalogue with 93 references.
- Pre-rendered product detail pages with factual product fields and a WhatsApp confirmation CTA; quantity/cart controls appear only when the price has current owner evidence.
- Persistent localStorage cart with quantity increase/decrease, remove item, order summary, and empty state.
- Checkout page optimized for Cash on Delivery.
- WhatsApp order message with customer info, product names, quantities, totals, order id, and city.
- Render API catalogue with a local fallback and stable public-slug reconciliation.
- Unique titles, descriptions, H1s, canonicals, social metadata, breadcrumbs, Product/Brand data, conditional Offer data, and clean URLs.
- Generated sitemap containing only canonical, indexable commercial and informational pages.
- Netlify 301 redirects from legacy category and product query URLs.
- Catalog validation for required fields, fail-closed price/stock evidence, categories, source URLs, duplicate IDs, image fallback, and sample routes.
- Image rights workflow that avoids competitor photos until commercial usage rights are verified.

## Tech Stack

- Static HTML pages
- Vanilla JavaScript ES modules
- CSS custom properties and responsive CSS
- Vite local dev server
- Render-hosted Flask API for catalogue/account/order data
- Netlify Functions scaffold for Stripe checkout extension

## Local Setup

```bash
npm install --cache ./.npm-cache
npm run dev
```

The source templates are available through `npm run dev`. To exercise the generated clean routes, build and preview:

```bash
npm run build
npm run preview
```

## npm Scripts

```bash
npm run dev
npm run generate:images
npm run generate:sitemap
npm run lint
npm run validate:catalog
npm run validate:seo
npm run build
npm run preview
```

- `dev`: starts the local Vite server.
- `generate:images`: regenerates the owned `.webp` category fallback visuals.
- `generate:sitemap`: regenerates the checked-in root `sitemap.xml` and `robots.txt`.
- `lint`: validates core files, local asset references, and guards against the old broken CSS reset.
- `validate:catalog`: validates catalogue facts, image-rights flags, neutral availability, and clean sample routes.
- `validate:seo`: checks every sitemap URL for unique metadata/H1, canonical consistency, JSON-LD, indexation controls, and legacy redirects.
- `build`: validates, copies assets, pre-renders product/category/trust pages, generates redirects, and writes the production sitemap to `dist/`.
- `preview`: previews the built static site with Vite.

## API and Local Catalog

The storefront requests the Render API first and falls back to the local catalogue. Use `backend=mock` or `localStorage.setItem('parapharmacie_backend', 'mock')` to force the local catalogue during development.

## Catalog Data

- Main data file: `js/catalog-data.js`
- Catalog logic: `js/catalog.js`
- Current product count: 93 catalogue references.
- API identifier bridge: `js/catalog-api-id-map.js`.
- Canonical route helpers: `js/seo-routes.js`.
- Core sources: public Moroccan parapharmacy pages, mainly `parapharma.ma`, plus Citymall Para for the exact Mustela 2en1 200ml example.
- Every product includes `sourceUrl`, a nullable `priceMAD`, neutral `stockStatus`, `tags`, `searchKeywords`, and `cityKeywords`.
- Generated product copy is limited to catalogue fields and avoids medical claims.
- Current catalogue prices are null and shown as « Prix à confirmer » until a traceable owner source and a verification date no older than 30 days exist.
- Ratings, reviews, numeric fallback stock, unsupported availability, and review schema are not generated.

## Image Rights

- Product image folder: `assets/products/`
- Active fallback: generated category `.webp` assets such as `assets/products/category-fallback-visage.webp`.
- Current catalog images are owned fallback visuals with `imageNeedsReview: true`.
- Competitor images were not copied into the repository.
- See `IMAGE_RIGHTS.md` for the production replacement workflow.

## Deployment Notes for parapharmacie.me

- Deploy the static files and `netlify/functions` folder to Netlify or another static host with functions support.
- Keep the Render API CORS origin aligned with `https://parapharmacie.me`.
- Replace placeholder images with approved `.webp` assets owned by Pharmacie Tawfiq, supplied by brands/distributors, or licensed for commercial e-commerce use.
- Connect live inventory and price confirmation from a business-backed source.
- Configure domain DNS for `parapharmacie.me`.
- Add analytics, conversion tracking, and a production WhatsApp/business number.
- Keep medical copy conservative: no unsupported treatment claims, and route sensitive questions to a professional.
- See `DEPLOYMENT.md` for Netlify/Vercel/static hosting steps and the launch checklist.

## Screenshots

Add final screenshots after deployment:

- `screenshots/homepage-desktop.png`
- `screenshots/shop-mobile.png`
- `screenshots/product-detail.png`
- `screenshots/cart-checkout.png`

## Roadmap

- Connect live inventory and categories from a backend.
- Add customer order tracking by phone/order id.
- Add admin order status updates and export.
- Add delivery fee rules by Moroccan city.
- Add product image CDN optimization with approved `.webp` files.
- Connect Search Console after sitemap submission.
