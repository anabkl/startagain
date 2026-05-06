# parapharmacie.me

Modern Moroccan parapharmacy e-commerce demo for **parapharmacie.me**, built as a portfolio-ready static storefront with Firebase support for production data.

## Project Overview

parapharmacie.me is designed for a Moroccan parapharmacy brand based in Khouribga. The storefront focuses on trusted wellness commerce: soins visage, produits cosmetiques, complements alimentaires, bebe et maman, livraison au Maroc, paiement a la livraison, and WhatsApp-assisted ordering.

The public demo works locally without a backend by using a realistic mock catalog. Firebase remains available for deployed environments and admin/order workflows.

## Features

- Premium responsive homepage with hero, categories, promotions, trust badges, testimonials, FAQ, and footer.
- Searchable/filterable shop catalog.
- Product detail page with quantity controls, trust signals, add-to-cart, and WhatsApp CTA.
- Persistent localStorage cart with quantity increase/decrease, remove item, order summary, and empty state.
- Checkout page optimized for Cash on Delivery.
- WhatsApp order message with customer info, product names, quantities, totals, order id, and city.
- Local mock catalog by default on localhost to keep the browser console clean.
- Firebase catalog/order support for production or explicit local backend testing.
- SEO metadata for Parapharmacie Maroc, Parapharmacie Khouribga, Livraison au Maroc, and Paiement a la livraison.

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
npm run build
npm run preview
```

- `dev`: starts the local Vite server.
- `lint`: validates core files, local asset references, and guards against the old broken CSS reset.
- `build`: validates and copies the static site to `dist/`.
- `preview`: previews the built static site with Vite.

## Firebase and Mock Catalog

Local preview uses the mock catalog by default on:

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

Use `backend=mock` or `localStorage.setItem('parapharmacie_backend', 'mock')` to force mock mode.

Production deployments use Firebase by default unless `backend=mock` is passed.

## Deployment Notes for parapharmacie.me

- Deploy the static files and `netlify/functions` folder to Netlify or another static host with functions support.
- Configure Firebase rules, allowed domains, and production project credentials before launch.
- Add real product images and inventory from the pharmacy backend or Firestore.
- Configure domain DNS for `parapharmacie.me`.
- Add analytics, conversion tracking, and a production WhatsApp/business number.
- Keep medical copy conservative: no unsupported treatment claims.

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
- Add product image CDN optimization.
- Add structured data for products and local business SEO.

## Screenshots

> Add production screenshots here after the next Netlify deployment.

- Homepage
- Product listing
- Product details
- Cart and checkout
- Mobile responsive view

