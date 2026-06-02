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

- **[HIGH]** Design Studio broken on mobile — `gridTemplateColumns:'64px 1fr 340px'` no breakpoint → add `studio-shell` class + `@media(max-width:900px)` stack layout. `app/design/page.tsx:674`
- **[HIGH]** No shared `<ShirtMockup>` component — same grey path hardcoded in 4 places (catalog:118,423 · artist:307,339). Create `components/ShirtMockup.tsx` with fabric gradient + folds.
- **[MED]** Catalog `productFilter` state not applied to filtered array — `app/catalog/page.tsx:209`
- **[MED]** `#6366F1` indigo in home nav (navBtn) is not a design system token — `app/home/page.tsx:130`
- **[MED]** Profile page is the most generic page — flat sections, `maxWidth:660`, no holo-card, no ghost text. `app/profile/page.tsx:148`
- **[MED]** `text-3` / `rgba(255,255,255,0.18–0.28)` below WCAG AA — affects catalog price hints, subscription fine print, profile labels
- **[LOW]** AI tool in studio says "match from catalog" (lookup) not generation — `app/design/page.tsx:1080`
- **[LOW]** Artist Studio vs Design Studio — naming confusion. `app/artist/page.tsx:143`

---

## 6. Decision Log (append-only — newest at bottom)

- **[2026-06-02 seed]** Default shirt color = **white** — black invisible on dark canvas; text auto-syncs to `color.textColor`.
- **[2026-06-02 seed]** Design studio = **3-panel layout** (rail 64px / canvas / properties 340px). Don't regress.
- **[2026-06-02 seed]** North star: **fashion brand, AI is the engine behind the scenes** — not "AI company selling shirts."
- **[2026-06-02 seed]** Styling idiom = **inline React style objects** in page components (Tailwind imported but not used in pages).
- **[2026-06-02 analysis]** Site scores ~40% fashion / 60% AI-company. Single biggest lever: a realistic garment component (fabric, folds, shadow) replacing the flat grey SVG path used in catalog, artist, and studio.
