# Stylx Production Readiness Audit

Last updated: 2026-07-03 (manager session)

## Current Verdict

Strong product, verified pipeline (tsc/lint/tests/build all clean, 37 tests).
Remaining gap to a serious public launch is external services, which the owner
will green-light explicitly ("production ready") - until then all work is
local revenue/retention features.

## Done (2026-07-03)

- Editor decomposition: StudioCanvas, OrderRequestModal (dynamic import),
  ShareFan, Upload/AI/Shapes panels, keyboard/persistence/history hooks.
  page.tsx 2062 -> 1701 lines (~134KB).
- Guided flow: nextStep engine drives all primary CTAs; live 3-step progress;
  studio opens on templates.
- Revenue: volume discounts (2/-5%, 3/-10%, 5/-15%), print-location
  surcharges (back +4.99, sleeve +2.49), server-side pricing (lib/pricing,
  tested), qty bug fixed (server was recording qty 1 always).
- Growth: share links encode the design (/design?d=...), catalog remix
  (/design?remix=id), "Remix in studio" on catalog detail pages.
- Retention: catalog favorites + Saved filter, profile Saved Designs with
  Order/Remix links, ContinueDesignBanner on home/catalog, clickable order
  history, home "Hot right now" strip.
- Email: lib/email.ts (Resend HTTP, no dep) wired into order creation and
  admin status changes; honest no-op until RESEND_API_KEY exists. DORMANT
  by owner decision until production.
- Mobile: sticky checkout bar <=760px, 100dvh, viewportFit cover, Playwright
  390x844 screenshot audit (fixed quickstart/zoom overlap).
- Security audit: rate limits on all routes, strict CSP, hardened sessions,
  protected cron, server-side pricing. No gaps found.
- Status labels/colors: single source in lib/types (re-exported via
  lib/orderStatus).

## Next (in priority order)

1. When owner says "production ready": RESEND_API_KEY + EMAIL_FROM, payment
   (Paddle/LemonSqueezy/PayPal - Stripe unavailable for IL bank), domain,
   Printify, Redis rate-limit if multi-instance.
2. Next build items: weekly owner digest in admin, multi-product studio
   (hoodies/long-sleeve), community gallery (opt-in at checkout).
3. Ongoing: keep e2e green (34), watch Category-demand panel, run
   /api/cron/catalog weekly + /api/cron/shipments monthly once deployed.

Completed 2026-07-03 (automation sprint): UsageEvent analytics + Category
demand panel, procedural design generator + admin one-click publish +
demand-driven /api/cron/catalog, legal pages (terms/privacy/refunds),
customer self-cancel of DRAFT orders, password reset flow.

Completed earlier: TextPanel extracted (decomposition done),
truth audit (all claims verified), de-AI rebrand to STYLX, catalog at 20
designs, mockups compressed 3.2MB -> 451KB, dead code removed, e2e 34/34.

## Verification loop (every batch)

npx tsc --noEmit && npm run lint && npm test && npm run build
