# Deployment Checklist for parapharmacie.me

This project is a static-first storefront with pre-rendered SEO pages and a Render API for accounts, catalogue reconciliation, and orders. The local catalogue remains the fallback and canonical slug source.

## Recommended Hosts

### Netlify

1. Connect the GitHub repository.
2. Use build command `npm run build` (also declared in `netlify.toml`).
3. Set publish directory: `dist`
4. Keep `netlify/functions` enabled for future payment/order extensions.
5. Add the custom domain `parapharmacie.me`.
6. Enable HTTPS and redirect all traffic to the primary domain.

### Vercel

1. Import the repository.
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add `parapharmacie.me` in Project Domains.
5. Confirm static assets under `assets/`, `css/`, and `js/` are served with cache headers.

### Static Hosting

1. Run `npm run build`.
2. Upload the contents of `dist/` to the host.
3. Confirm `sitemap.xml`, `robots.txt`, HTML pages, and assets are available at the root.

### Docker Compose

Nginx mounts `dist/` only. Build that public artifact before starting either Compose configuration:

```bash
npm ci
npm run build
docker compose up --build
```

Do not change the mount back to the repository root: source files, documentation and local configuration are not public assets. Repeat `npm run build` after every storefront change before restarting Nginx.

## Environment and Backend

- Production requests the Render API first and falls back to the local catalogue.
- Keep the descriptive local slug mapped to the API ID so clean product URLs and API order validation stay compatible.
- Do not treat the API seed stock as verified inventory; availability remains confirmation-based until a business-backed feed exists.
- Confirm Firestore and Storage rules before allowing admin uploads.
- Add the production domain to Firebase authorized domains.

## Pre-Launch Checklist

- Domain `parapharmacie.me` points to the production host.
- API origin and CORS configuration are intentionally chosen and documented.
- WhatsApp number is the final business number.
- Khouribga is the only confirmed local 15 MAD city. The owner must document the exact other supported cities before treating Oued Zem, Boujniba, Boulanouare or any other city as served.
- Product image rights are approved or products remain `imageNeedsReview: true`.
- No exact product price is published unless it has a traceable owner-controlled source and a non-future verification date no older than 30 days.
- No stock state is published unless `stockVerified: true`, a finite quantity and a non-future `stockVerifiedAt` no older than 24 hours are all present.
- Analytics and Search Console are installed.
- `sitemap.xml` is submitted in Search Console.
- `robots.txt` points to `https://parapharmacie.me/sitemap.xml`.
- Checkout Cash on Delivery copy is reviewed by the business owner.
- Medical/product copy stays conservative and avoids unsupported claims.

## Validation Before Deploy

```bash
npm run generate:images
npm run generate:sitemap
npm run validate:catalog
npm run validate:commerce
npm run validate:docs
npm run lint
npm run build
npm run validate:seo
```

Manual QA:

- `/`
- `/boutique/`
- `/soins-visage/`
- `/produits/avene-cleanance-gel-400/`
- `/cart.html`
- `/checkout.html`
- `/success.html`

Legacy `/shop.html?category=...` and `/product.html?id=...` URLs should return one-hop 301 redirects to their clean canonical routes.

## Product Image Policy

- Approved product photos must be optimized `.webp` files in `assets/products/`.
- Each approved product must include `imageSource`, `imageRightsStatus`, and `imageReplacementNote`.
- `imageNeedsReview` can be set to `false` only when the usage right is documented.
- Brand/competitor/public website images remain forbidden unless permission is explicit.
