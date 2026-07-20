# Archived frontend reference — not a deployable application

The production storefront is the root HTML/CSS/JavaScript tree (`/*.html`,
`/css`, `/js`). `scripts/build.mjs` copies only that tree to `dist/`.

This `frontend/` directory is an older, incomplete reference snapshot. It has
no HTML entry point, is not copied into `dist`, and must not be served,
deployed, or used for checkout testing. Its API, routing, accessibility, and
layout behavior is intentionally not treated as production behavior.

Any future consolidation must either remove this archived snapshot in a
separately reviewed change or replace it with a complete application and its
own build. Partial reuse is unsafe. Task 6A validators fail if a production
HTML/build path references `frontend/`.
