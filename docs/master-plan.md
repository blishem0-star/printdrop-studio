# STYLX Master Plan — Route to Highest Level

Written: 2026-07-09 (manager session). Based on market research + full codebase audit.
This is the strategic source of truth. Tactical status lives in production-readiness-audit.md.

## Research findings that shape this plan

1. **Hyper-specific niches convert 3-5x better than broad ones** (Printify/Etsy data 2026).
   "Fishing dad est. 2026" beats "funny shirts". Our demand-driven catalog generator is
   built for exactly this — point it at micro-niches, not broad categories.
2. **Product configurators done right raise conversion up to 40%**; the killers are
   cognitive overload (>7 visible choices) and desktop-first design (60% of traffic is mobile).
3. **70% of carts are abandoned**; top fixes: one-page checkout, guest checkout (we have),
   total price upfront (we have), wallet payments when we go live (Apple/Google Pay
   two-tap = highest impact single addition).
4. **Group/event orders (bachelorette, teams, family reunions) are the highest-AOV
   segment** in custom apparel; every major player (CustomInk, RushOrderTees) leads with
   "Names & Numbers" group flows. Our volume discounts (2/-5% … 5+/-15%) are the hook.
5. **Time-to-first-desirable-result is the #1 retention driver for design tools** —
   start from finished designs, not a blank canvas.

## The plan — 7 tracks

### A. Editor (conversion core) — staged, each shippable
- A1 Starter gallery: first screen = 8-12 finished designs rendered on the garment,
  one click applies. Blank canvas becomes the option, not the default.
- A2 Shuffle: one-click curated restyle (font+palette+shirt combos), undo-safe. Fun loop.
- A3 Layout reset: 75% canvas, icon-only left rail, ONE contextual right panel,
  garment-side thumbnails on canvas, layers as flyout, guided steps -> header pill.
- A4 Direct manipulation: inline text editing on canvas, floating mini-toolbar at the
  selection (font/size/color/B/I/dup/del), drag art from panel to shirt.
- A5 Pre-flight check moves into checkout (quality score leaves the live UI).

### B. Catalog & merchandising (what actually sells)
- B1 Micro-niche collections: retool generator categories into identity equations
  (pet+coffee, gym+sarcasm, fishing+dad, gamer+retro, nurse+night-shift...).
  Demand panel decides which grow.
- B2 Collection landing pages per niche (SEO factories, ItemList schema — pattern exists).
- B3 Occasions hub: bachelorette / team / family-reunion entry points -> group flow (C2).

### C. Funnel & money
- C1 One-page order review: fewer fields above the fold, order summary sticky.
- C2 **Group orders**: one design -> size/qty matrix (S x2, M x5...), per-person name
  option ("Names & Numbers"), volume discount auto-applied and SHOWN as savings.
  Biggest AOV lever available without external services.
- C3 Post-order loop: confirmation screen offers matching hoodie (multi-product studio
  exists) + auto-coupon for next design (coupon system exists).
- C4 Abandoned design recovery: local = ContinueDesignBanner (exists) + "your design
  is waiting" nudge; email sequence once RESEND key arrives (templates ready, dormant).

### D. Share & viral
- D1 Dynamic OG image per design/order — WhatsApp preview shows THEIR shirt.
- D2 Remix framing: shared link opens "X's design — make it yours" banner.
- D3 Matching sets: one click duplicates design across products/colors for couples/teams.

### E. Retention
- E1 Visual closet ("My Designs" as garment thumbnails grid).
- E2 Weekly drops: generator publishes weekly batch -> "New this week" rail on home
  + catalog; newsletter announcement when email goes live.
- E3 Order history -> one-click reorder / remix-into-new-product.

### F. Platform quality
- F1 Continue page.tsx decomposition alongside A3 (target < 900 lines).
- F2 Performance pass: LCP on landing/catalog/studio, bundle audit of studio,
  images to next/image where applicable.
- F3 Accessibility sweep (focus traps in modals, aria on canvas controls, contrast).
- F4 E2E coverage for every new flow (starter gallery, shuffle, group order).

### G. Ops & measurement
- G1 Funnel metrics via UsageEvent: studio_start -> first_layer -> size_picked ->
  order_submitted; time-to-first-layer. Admin funnel panel.
- G2 Weekly autonomous loop: read demand panel -> generate niche batch -> publish ->
  measure. Document each cycle in this file.

## Blocked until owner declares "production ready"
Payments (Paddle/LemonSqueezy/PayPal — no Stripe for IL bank; wallets via provider),
RESEND_API_KEY + EMAIL_FROM, domain, Printify fulfillment, deploy (Vercel+Turso),
Redis rate-limit if multi-instance, real analytics baseline.

## Execution order (each step ships verified: tsc/lint/test/build/e2e/screenshots)
1. A1+A2 (starter gallery + shuffle) — conversion + fun, ~2 sessions
2. G1 (funnel metrics) — so every later change is measurable
3. A3 (layout reset) then A4 (direct manipulation) — the "real software" feel
4. C2 (group orders) + B3 (occasions entry) — AOV jump
5. D1 (dynamic OG) + D3 (matching sets) — viral loop
6. B1+B2 (micro-niche collections + SEO pages) — traffic engine
7. E1+E2 (closet + weekly drops), C3 (post-order loop), A5, F2/F3 ongoing
