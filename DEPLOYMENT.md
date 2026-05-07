# Deployment Checklist for parapharmacie.me

This project is a static storefront with optional Firebase-backed catalog, admin, and order workflows. The safest first launch path is a static deployment with the local verified catalog, then production Firebase once business data and permissions are confirmed.

## Recommended Hosts

The current codebase is a fast static Vite storefront, not a Next.js app. Production-ready clean category/product URLs are generated during `npm run build`, and Firebase Hosting rewrites are included in `firebase.json`.

### Netlify

1. Connect the GitHub repository.
2. Set build command: `npm run generate:sitemap && npm run build`
3. Set publish directory: `dist`
4. Keep `netlify/functions` enabled for future payment/order extensions.
5. Add the custom domain `parapharmacie.me`.
6. Enable HTTPS and redirect all traffic to the primary domain.

### Vercel

1. Import the repository.
2. Set build command: `npm run generate:sitemap && npm run build`
3. Set output directory: `dist`
4. Add `parapharmacie.me` in Project Domains.
5. Confirm static assets under `assets/`, `css/`, and `js/` are served with cache headers.

### Static Hosting

1. Run `npm run generate:sitemap && npm run build`.
2. Upload the contents of `dist/` to the host.
3. Confirm `sitemap.xml`, `robots.txt`, HTML pages, and assets are available at the root.
4. Confirm generated clean routes exist, for example `dist/categorie/visage/index.html` and `dist/produit/avene-cleanance-gel-400/index.html`.

### Firebase Hosting

1. Install and authenticate Firebase CLI.
2. Confirm the Firebase project and authorized domains.
3. Run `npm run generate:sitemap && npm run build`.
4. Deploy hosting and rules with `firebase deploy --only hosting,firestore:rules,storage`.
5. Test `/`, `/shop.html`, `/categorie/visage/`, and `/produit/avene-cleanance-gel-400/` on the production domain.

## Environment and Backend

- Local demos use the verified mock catalog by default.
- Production can use Firebase when the production flag/config is ready.
- Keep Firebase disabled for public launch until catalog, stock, and rules are confirmed.
- Confirm Firestore and Storage rules before allowing admin uploads.
- Add the production domain to Firebase authorized domains.
- Firestore product categories must use canonical slugs: `visage`, `corps`, `cheveux`, `bebe-maman`, `solaire`, `hygiene`, `sante`, `supplements`, `homme`, `bio`, `paramedical`, and `promotions`.
- Signup creates `users/{uid}` with role `user`; promote admins manually from the Firebase console after confirming identity.

## Pre-Launch Checklist

- Domain `parapharmacie.me` points to the production host.
- Firebase production flag/config is intentionally chosen and documented.
- WhatsApp number is the final business number.
- Delivery cities are confirmed: Khouribga, Oued Zem, Boujniba, Boulanouare, and national delivery rules.
- Product image rights are approved or products remain `imageNeedsReview: true`.
- Prices and stock are checked against the pharmacy/distributor before launch.
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
npm run lint
npm run build
```

Manual QA:

- `/`
- `/shop.html`
- `/categorie/visage/`
- `/produit/avene-cleanance-gel-400/`
- `/cart.html`
- `/checkout.html`
- `/success.html`
- `/orders.html`

## Product Image Policy

- Approved product photos must be optimized `.webp` files in `assets/products/`.
- Each approved product must include `imageSource`, `imageRightsStatus`, and `imageReplacementNote`.
- `imageNeedsReview` can be set to `false` only when the usage right is documented.
- Brand/competitor/public website images remain forbidden unless permission is explicit.
