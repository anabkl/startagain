# parapharmacie.me

Modern Moroccan parapharmacy e-commerce demo for **parapharmacie.me**, built as a portfolio-ready static storefront for Pharmacie Tawfiq with Firebase support for production data.

## Project Overview

parapharmacie.me is designed for a Moroccan parapharmacy brand based in Khouribga. The storefront focuses on trusted wellness commerce: pharmacie Tawfiq, parapharmacie Tawfiq, parapharmacie Khouribga, parapharmacie Oued Zem, parapharmacie Boujniba, parapharmacie Boulanouare, produits cosmetiques, soins visage, complements alimentaires, bebe et maman, livraison au Maroc, paiement a la livraison, and WhatsApp-assisted ordering.

The public demo works locally without a backend by using a sourced Moroccan catalog. Firebase remains available for deployed environments and admin/order workflows.

## Features

- Premium responsive homepage with hero, categories, promotions, trust badges, testimonials, FAQ, and footer.
- Searchable/filterable shop catalog with 93 real Moroccan market product references.
- Product detail page with quantity controls, trust signals, add-to-cart, source URL, and WhatsApp CTA.
- Persistent localStorage cart with quantity increase/decrease, remove item, order summary, and empty state.
- Checkout page optimized for Cash on Delivery.
- WhatsApp order message with customer info, product names, quantities, totals, order id, and city.
- Local sourced catalog by default on localhost to keep the browser console clean.
- Firebase catalog/order support for production or explicit local backend testing.
- SEO metadata for Pharmacie Tawfiq, parapharmacie Tawfiq, Parapharmacie Maroc, Parapharmacie Khouribga, Oued Zem, Boujniba, Boulanouare, Livraison au Maroc, and Paiement a la livraison.
- Catalog validation script for required fields, prices, categories, source URLs, duplicate IDs, image fallback, and sample product routes.
- Image rights workflow that avoids competitor photos until commercial usage rights are verified.

## Tech Stack

- Static HTML pages
- Vanilla JavaScript ES modules
- CSS custom properties and responsive CSS
- Vite local dev server
- Firebase client SDK for production/admin data
- Netlify Functions scaffold for Stripe checkout extension

## Local Setup

```bash
npm install --cache ./.npm-cache
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## npm Scripts

```bash
npm run dev
npm run lint
npm run validate:catalog
npm run build
npm run preview
```

- `dev`: starts the local Vite server.
- `lint`: validates core files, local asset references, and guards against the old broken CSS reset.
- `validate:catalog`: validates production catalog data and sample product detail URLs.
- `build`: validates and copies the static site to `dist/`.
- `preview`: previews the built static site with Vite.

## Firebase and Local Catalog

Local preview uses the sourced local catalog by default on:

- `localhost`
- `127.0.0.1`
- `::1`

This avoids Firestore connection noise during demos and keeps the storefront usable offline.

To explicitly test Firebase locally:

```text
http://127.0.0.1:5173/shop.html?backend=firebase
```

Or set:

```js
localStorage.setItem('parapharmacie_backend', 'firebase')
```

Use `backend=mock` or `localStorage.setItem('parapharmacie_backend', 'mock')` to force local catalog mode.

Production deployments use Firebase by default unless `backend=mock` is passed.

## Catalog Data

- Main data file: `js/catalog-data.js`
- Catalog logic: `js/catalog.js`
- Current product count: 93 sourced products.
- Core sources: public Moroccan parapharmacy pages, mainly `parapharma.ma`, plus Citymall Para for the exact Mustela 2en1 200ml example.
- Every product includes `sourceUrl`, `priceMAD`, `stockStatus`, `tags`, `searchKeywords`, and `cityKeywords`.
- Product descriptions are rewritten for this project and avoid medical claims.
- Prices are indicative and should be reconfirmed before shipment.

## Image Rights

- Product image folder: `assets/products/`
- Active fallback: `assets/products/product-placeholder.svg`
- Current catalog images are placeholders with `imageNeedsReview: true`.
- Competitor images were not copied into the repository.
- See `IMAGE_RIGHTS.md` for the production replacement workflow.

## Deployment Notes for parapharmacie.me

- Deploy the static files and `netlify/functions` folder to Netlify or another static host with functions support.
- Configure Firebase rules, allowed domains, and production project credentials before launch.
- Replace placeholder images with approved `.webp` assets owned by Pharmacie Tawfiq, supplied by brands/distributors, or licensed for commercial e-commerce use.
- Connect live inventory and price confirmation from the pharmacy backend or Firestore.
- Configure domain DNS for `parapharmacie.me`.
- Add analytics, conversion tracking, and a production WhatsApp/business number.
- Keep medical copy conservative: no unsupported treatment claims, and route sensitive questions to a professional.

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
- Add structured data for products and local business SEO.
