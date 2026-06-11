# STYLX — Design Decisions & Memory

> **Living memory for the `stylx-designer` agent.** This file is the source of continuity between sessions — the agent is stateless without it.
> Tokens below are mirrored from `app/globals.css` `:root`. If they ever disagree, **globals.css is the source of truth**.

---

## 0. QUICK REF (read this every time — saves re-reading globals.css)

```
bg:      #050507 → #060610 gradient
accent:  #00E5C8 (teal) · #0099FF (blue) · #7B61FF (purple, holo only)
surface: rgba(255,255,255,0.03)   border: rgba(255,255,255,0.07)
text:    #fff · rgba(255,255,255,0.55) · rgba(255,255,255,0.25)
radius:  16px / 10px / 24px       gap: 12–14px   pad: 2rem
font:    Bebas Neue (display, weight:400, ls:0.02–0.03em) + Outfit (body)
holo:    linear-gradient(135deg,#00E5C8,#0099FF,#7B61FF,#00E5C8)
```

**Read `app/globals.css` only when:** (a) editing tokens/classes, (b) checking a class you don't see in section 2 below, (c) something looks wrong. For everything else, use this Quick Ref.

---

## 1. Canonical Design Tokens (full — from `app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050507` | page background base |
| `--surface` | `rgba(255,255,255,0.03)` | card / panel fill |
| `--surface-hover` | `rgba(255,255,255,0.055)` | hover fill |
| `--border` | `rgba(255,255,255,0.07)` | default border |
| `--border-strong` | `rgba(255,255,255,0.13)` | hover / emphasis border |
| `--accent` | `#00E5C8` | primary teal |
| `--accent-2` | `#0099FF` | blue |
| `--accent-glow` | `rgba(0,229,200,0.22)` | glow tint |
| `--text` / `--text-2` / `--text-3` | `#FFF` / `rgba(255,255,255,0.55)` / `rgba(255,255,255,0.25)` | text hierarchy |
| purple | `#7B61FF` | tertiary accent (holo gradients only — not in `:root`) |

Page background: `linear-gradient(180deg,#050507 0%,#060610 100%)`.
Spacing rhythm: cards `2rem` pad · section gaps `3–3.5rem` · grid gaps `12–14px` · pill pad `5–6px 12–14px`.

---

## 2. Reusable Components in `globals.css` — ALWAYS PREFER THESE

- **Typography:** `.display`, `.display-sm`, `.heading`, `.subheading`, `.label`, `.g-text`
- **Surfaces:** `.glass`, `.glass-strong`, `.card`, `.card-selected`
- **Buttons:** `.btn` / `.btn-lg` / `.btn-sm` × `.btn-primary` / `.btn-ghost` / `.btn-outline` / `.btn-holo`
- **Bits:** `.tag`, `.divider`, `.input`
- **Effects:** `.scan-card`, `.holo-card`, `.hover-lift`, `.glow-animated`, `.glow-border-teal`, `.text-glow-teal`, `.text-reveal`, `.glitch-in`, `.float-y`, `.fade-up`, `.particle`, `.scan-line`, `.spin-slow`, `.noise`
- **Responsive:** `.rsp-pad`, `.rsp-1col`, `.rsp-2col`, `.rsp-stack`, `.rsp-hide`, `.studio-2col/3col/4col`

Use `var(--accent)`, `var(--radius)` etc. — never re-type raw hex/px values.

---

## 3. Breakpoints (match exactly — don't invent new ones)

| px | what changes |
|---|---|
| 640 | studio grids collapse |
| 600 | `rsp-*` helpers kick in |
| 480 | `.display` / `.heading` shrink |
| 400 | `rsp-2col` → 1col |

`prefers-reduced-motion` honored globally — never use motion to convey meaning.

---

## 4. Good vs Bad (real STYLX patterns)

**GOOD — quick-action card (`app/home/page.tsx:177`):** gradient fill + `scan-card holo-card` + ghost number `"01"` at `5rem rgba(accent,0.05)` + icon tile + Bebas title + teal CTA with arrow. Hover lifts `translateY(-4px)` with colored shadow. **Reads as designed, not as a form.**

**BAD:** flat `rgba(255,255,255,0.03)` rectangle, `fontWeight:700` title, grey body text, no hover, no accent. If a card has no second layer (ghost text / gradient / glow / hover transform) → it is unfinished.

**GOOD — number/price:** Bebas Neue `3rem` + `.g-text` gradient clip.
**BAD:** plain white number in body font.

**BAD — emoji as icons** (✏️🎨🛒): looks cheap on a premium platform. Use SVG stroke icons (`strokeWidth:1.5`) instead.

---

## 5. Open Backlog (discovered issues — remove when fixed)

> Format: `[priority: HIGH/MED/LOW] description — file:line`

- [LOW] Design studio (`app/design/page.tsx`) Bold Meter ~3/7 — visual-only, has pre-existing lint errors, do not restructure hooks. Could use ghost text + g-text on order panel total.
- [LOW] Home `navBtn('indigo')` naming — functions fine (maps to blue #0099FF) but label says 'indigo'; cosmetic.
- [MED] Catalog cards all same size — no density contrast / featured card. Consider 1 large 2-col featured card.

> Next audit should focus on: catalog density contrast, design studio editorial polish, animation timing consistency.

---

## 6. Decision Log (append-only — newest at bottom)

- **[2026-06-02 seed]** Default shirt color = **white** — black invisible on dark canvas; text auto-syncs to `color.textColor`.
- **[2026-06-02 seed]** Design studio = **3-panel layout** (rail 64px / canvas / properties 340px). Don't regress.
- **[2026-06-02 seed]** North star: **fashion brand, AI is the engine behind the scenes** — not "AI company selling shirts."
- **[2026-06-02 seed]** Styling idiom = **inline React style objects** in page components (Tailwind imported but not used in pages).
- **[2026-06-02 analysis]** Site scores ~40% fashion / 60% AI-company. Single biggest lever: a realistic garment component (fabric, folds, shadow) replacing the flat grey SVG path used in catalog, artist, and studio.
- **[2026-06-02 fix]** HIGH-1: studio-shell/rail/properties/canvas CSS classes added — `@media(max-width:900px)` stacks 3-panel to 1-col, rail goes horizontal bottom bar.
- **[2026-06-02 fix]** HIGH-2: `components/ShirtMockup.tsx` created — fabric gradient + fold + collar shadow; replaces hardcoded path in catalog:118,423 and artist:306,338.
- **[2026-06-02 fix]** MED-1: productFilter now applied to `filtered` array in catalog (`d.productType === productFilter`); added optional `productType` field to `CatalogDesign` type.
- **[2026-06-02 fix]** MED-2: navBtn 'indigo' branch replaced with `--accent-2` blue (#0099FF) tokens; hover handlers updated to match.
- **[2026-06-02 fix]** MED-3: Profile maxWidth 660→820; identity card gets `scan-card holo-card` + ghost initial; section headers get teal left-border accent; AI Style Profile section gets teal tinted bg/border.
- **[2026-06-02 fix]** MED-4: Non-decorative text at 0.18–0.28 opacity raised to 0.45 across catalog, home, artist, profile.
- **[2026-06-02 fix]** LOW-1: AI tool description changed from "match from catalog" to "Describe what you want — AI will generate a design for your shirt."
- **[2026-06-02 fix]** LOW-2: "Artist.Studio" → "Creator.Hub" in artist page header to avoid collision with "Design Studio".
- **[2026-06-04 analysis-2]** Second-pass audit complete. Site now ~52% fashion / 48% AI-company (up from ~40%). Single remaining lever: systematic emoji→SVG icon replacement across nav, admin sidebar, quick-actions, and trust bullets. Discovered: ShirtMockup viewBox clip bug (LOW-A), admin table missing hover states (LOW-B), profile order history flat swatch (HIGH-D), auth form emoji role selector (MED-D). Admin pages functional but untouched by round-1 fixes — stat cards solid, tables readable, but zero hover/lift and emoji icons throughout. Top 5 next: (1) Admin sidebar SVG icons, (2) Home nav emoji→SVG, (3) Profile order ShirtMockup thumbnail, (4) Catalog empty state redesign, (5) ShirtMockup viewBox fix.
- **[2026-06-04 fix-2]** COMPLETE EMOJI PURGE: All emoji replaced with SVG stroke icons across all pages (admin, home, catalog, artist, profile, design, landing, not-found). ShirtMockup viewBox fixed to `0 0 s s*1.175`. Admin sidebar: 6 SVG icons. Admin quick-links: scan-card holo-card + colored icon tiles. Admin stat cards: ghost number watermarks 01–06. Admin tables: `.admin-tr` CSS hover class (globals.css). Profile orders: ShirtMockup thumbnail replaces flat color swatch. Catalog empty state: Bebas headline + teal icon + styled CTA. Stats strip: grid layout (no wrap bug). Over 40 emoji instances replaced total.
- **[2026-06-04 design-review-3]** Full fresh read of all pages — no further issues found. Site now ~70% fashion / 30% AI-company. Backlog cleared.
- **[2026-06-12 audit-4]** Elite-level cross-site audit. Catalog was weakest (Bold Meter 2/7 — no hero/ghost/billboard). Ranked fixes: catalog billboard > landing brand violations > artist hook elevation > admin emoji bug > profile status strip.
- **[2026-06-12 fix-4 CATALOG]** Added editorial billboard hero between filters and grid (`catalog:291`): ghost word "WEAR IT" at 22vw rgba(accent,0.04), Bebas headline "Designed by AI. / Worn by you." with holo g-text on line 2, `.text-reveal`, stat strip (designs/300dpi/72h/50%) with teal dividers + g-text numbers. Catalog Bold Meter 2→6/7.
- **[2026-06-12 fix-4 LANDING]** Brand violations fixed: "The Process" h2 now holo g-text (`page.tsx:639`); LiquidCard label `fontWeight:900`→Bebas (`page.tsx:280`); footer logo `fontWeight:900`→Bebas (`page.tsx:676`).
- **[2026-06-12 fix-4 ARTIST]** Earnings banner promoted to billboard — ghost "50%" watermark + g-text hook line "You keep 50% on every sale" now shows to ALL creators (was empty-state only). `artist:150`.
- **[2026-06-12 fix-4 ADMIN]** Fixed empty emoji square in recent-orders design cell (`admin/page.tsx:125`) — `design.emoji` is empty post-purge; replaced with Bebas first-initial on colored swatch.
- **[2026-06-12 fix-4 PROFILE]** Identity card meta line → status stat strip (Orders / Member since / Tier) with Bebas g-text numbers + teal dividers (`profile:214`). Turns identity into status symbol.
- **[2026-06-12 verify-4]** `npm run build` ✓ 23/23 pages. No new lint errors. Design studio untouched (visual-only constraint respected).
