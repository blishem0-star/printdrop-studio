# STYLX — Design Decisions & Memory

> **Living memory for the `stylx-designer` agent.** Read this fully at the start of every design task. Append new decisions at the bottom of the log. This file is the source of continuity between sessions — the agent is stateless without it.
> Tokens below are mirrored from `app/globals.css` `:root`. If they ever disagree, **globals.css is the source of truth** — re-read it and update this file.

---

## 1. Canonical Design Tokens (from `app/globals.css`)

### Color
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
| `--text` / `--text-2` / `--text-3` | `#FFF` / `rgba(255,255,255,0.55)` / `rgba(255,255,255,0.25)` | primary / secondary / tertiary text |
| purple | `#7B61FF` | tertiary accent (holo gradients only) |

Page background gradient used across pages: `linear-gradient(180deg,#050507 0%,#060610 100%)`.

### Radius / Type
- `--radius: 16px` · `--radius-sm: 10px` · `--radius-lg: 24px`
- `--font-display: 'Bebas Neue'` (headings, `fontWeight:400`, `letterSpacing` ~`0.02–0.03em`)
- `--font-body: 'Outfit'`
- Holo gradient: `linear-gradient(135deg,#00E5C8,#0099FF,#7B61FF,#00E5C8)`

### Spacing rhythm (de-facto in the codebase)
Cards pad `2rem`; section gaps `3–3.5rem`; grid gaps `12–14px`; pill pad `5–6px 12–14px`. Keep to this rhythm — don't invent new spacing values.

---

## 2. Reusable Components Already in `globals.css` — PREFER THESE over one-offs

- **Typography:** `.display`, `.display-sm`, `.heading`, `.subheading`, `.label`, `.g-text` (gradient text)
- **Surfaces:** `.glass`, `.glass-strong`, `.card` (+ `.card-selected`)
- **Buttons:** `.btn` (+ `.btn-lg`/`.btn-sm`) × `.btn-primary` / `.btn-ghost` / `.btn-outline` / `.btn-holo`
- **Bits:** `.tag`, `.divider`, `.input`
- **Motion/effects:** `.scan-card`, `.holo-card`, `.hover-lift`, `.glow-animated`, `.glow-border-teal`, `.text-glow-teal`, `.text-reveal`, `.glitch-in`, `.float-y`, `.fade-up`, `.particle`, `.scan-line`, `.spin-slow`
- **Responsive helpers:** `.rsp-pad`, `.rsp-1col`, `.rsp-2col`, `.rsp-stack`, `.rsp-hide`, `.studio-2col/3col/4col`

**Rule:** if a class above does the job, use it. Add a new global class only for a genuinely reusable pattern — never copy a big inline blob into many files.

---

## 3. Breakpoints (already defined — match them exactly)
- `640px` — studio grids collapse
- `600px` — `rsp-*` helpers kick in (1col, 2col, stacked, hidden)
- `480px` — display/heading shrink
- `400px` — `rsp-2col` → 1 col

`prefers-reduced-motion` is honored globally — never rely on motion to convey meaning.

---

## 4. Good vs Bad (real STYLX patterns)

**GOOD — quick-action card (`app/home/page.tsx`):** layered depth — gradient fill + `scan-card holo-card` + a giant ghost number (`"01"` at `5rem`, `rgba(accent,0.05)`) + icon tile + Bebas title + uppercase teal CTA with arrow, hover lifts `translateY(-4px)` with a colored shadow. This reads as *designed*, not as a form.

**BAD:** a flat `rgba(255,255,255,0.03)` rectangle with a plain `fontWeight:700` title and grey body text, no hover, no accent, no hierarchy. Looks like any SaaS. If a card has no second layer (ghost text / gradient / glow / hover transform) it is unfinished.

**GOOD — pricing/number emphasis:** Bebas Neue at `3rem` with `.g-text` gradient clip. **BAD:** plain white number in body font.

---

## 5. Decision Log (append-only — newest at bottom)

- **[seed]** Default shirt color = **white**, not Midnight Black — black is invisible on the dark canvas; text color auto-syncs to `color.textColor`. (lib/mockData.ts SHIRT_COLORS[0] is black — do not default to index 0 on dark surfaces.)
- **[seed]** Design studio uses a **3-panel layout** (left icon sidebar / center canvas / right contextual properties) — the industry-standard tool shape. Keep this; don't regress to a form.
- **[seed]** North star: STYLX = **fashion brand, AI is the engine behind the scenes** — not "an AI company selling shirts." Every change should add fashion soul (garments, people, fabric, editorial), not more generic-AI sheen.
- **[seed]** Styling idiom = **inline React style objects** in page components (Tailwind is imported but pages don't use utility classes). Match it.
