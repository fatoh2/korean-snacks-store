# Lulu Tokki

A multilingual Korean and international snacks storefront built with React, Vite, Firebase, and Cloudflare R2. The customer experience supports Arabic, Hebrew, and English, including RTL layouts.

[Visit the live storefront](https://lulu-tokki.vercel.app/) · [View the portfolio case study](https://fhaj.vercel.app/work/lulu-tokki)

## Features

- Product catalog, category filters, search, wishlist, cart, and product variants
- Firebase email/password authentication and customer order history
- WhatsApp checkout with Firestore order persistence and promo codes
- Admin tools for products, categories, orders, customers, analytics, and promotions
- Light/dark themes and installable PWA support
- Authenticated image uploads through a Cloudflare Worker and R2

## Local development

Requirements: Node.js 20 or newer and a Firebase project.

```bash
npm install
copy .env.example .env
npm run dev
```

The development server runs at `http://localhost:5174`.

## Environment variables

Create `.env` with these client-side settings:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_IMAGE_UPLOAD_URL=
```

These are Firebase web configuration values, not server secrets. Never place private service-account keys in `VITE_*` variables because Vite embeds them in the browser bundle.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Firebase

Enable Email/Password Authentication and create a Firestore database. Deploy the included security rules before using the application:

```bash
firebase deploy --only firestore:rules
```

The admin email allowlist currently appears in both `src/context/AuthProvider.jsx` (UI access) and `firestore.rules` (data enforcement). Keep them synchronized. For a larger team, migrate this to Firebase custom claims.

Orders are submitted by browser clients. The rules constrain their shape and ownership, but authoritative price verification requires moving order creation to a trusted backend.

## Image upload worker

The worker lives in `workers/image-upload`. Configure its R2 binding and production origin in `wrangler.toml`, then deploy it with Wrangler. It validates Firebase ID tokens, permits only configured admin emails, accepts image files up to 5 MB, and writes them under `product-images/`.

## Deployment

The SPA is configured for Vercel through `vercel.json`. Add the same environment variables to the Vercel project before deploying. The service worker and web manifest are served from `public/`.
