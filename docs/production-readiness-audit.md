# Stylx Production Readiness Audit

Last updated: 2026-07-01

## Current Verdict

Stylx is buildable and functional, but it should be treated as an active hardening project before a serious public launch. The biggest risks are not basic compilation. They are product truthfulness, editor maintainability, payload weight, and operational clarity.

## Priority 0 - Business Correctness

- New order requests must not be stored as paid before a payment provider exists.
- Admin revenue must count confirmed value only, not every open request.
- Customer-facing status text must match the actual workflow: request, review, payment confirmation later, production later.

Status: first fixes applied. New order requests now start as `DRAFT`, order tracking starts at request received, admin/customer confirmed value excludes open requests, and the admin customer-to-orders filter now works end to end.

## Priority 1 - Editor Architecture

The editor is the most important product surface and still too large in one file.

Current state:
- `app/design/page.tsx` is still about 171KB after the first extraction.
- The file mixes state management, SVG rendering, tool panels, sharing UI, ordering UI, keyboard shortcuts, and persistence.

Target structure:
- `components/design/ShareFan.tsx`
- `components/design/StudioCanvas.tsx`
- `components/design/LayerPanel.tsx`
- `components/design/ToolSidebar.tsx`
- `components/design/OrderRequestModal.tsx`
- `hooks/useDesignHistory.ts`
- `hooks/useDesignKeyboardShortcuts.ts`
- `hooks/useStudioPersistence.ts`

Status: started. `ShareFan` and `useDesignHistory` were extracted, and studio workflow/tool configuration moved into `lib/studio/constants.ts`.

## Priority 2 - Performance

Known issues:
- The design page ships too much client code at once.
- Heavy editor panels should be split and loaded only when needed.
- Repeated inline styles increase component noise and make optimization harder.

Targets:
- Reduce `app/design/page.tsx` under 80KB source.
- Split non-critical panels with dynamic imports where appropriate.
- Keep first editor load focused on canvas, core actions, and primary tools.

## Priority 3 - UX Clarity

Known issues:
- The editor has many powerful features, but some are still buried.
- Empty states and next-step guidance need to be more intentional.
- Admin labels must stay operationally honest while external integrations are not connected.

Targets:
- Add a clear first-run path: choose template, add text/image, review request.
- Improve active tool state and selected layer affordances.
- Keep all text aligned with the current no-third-party phase.

Status: started. Order request failures now surface server-provided errors in the editor and catalog instead of a generic failure message.

## Priority 4 - Code Quality

Known issues:
- Some older files still contain broken encoding in comments or legacy copy.
- Some domain labels are duplicated in pages instead of centralized.
- Order status meaning needs a clearer business contract.

Targets:
- Centralize order status labels and colors.
- Remove remaining mojibake from source.
- Add focused tests for order request status and pricing behavior.

Status: started. Added order status tests and template encoding tests.

## Priority 5 - Verification

Required checks after every meaningful batch:
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run lint`
- `cmd /c npm test`
- `cmd /c npm run build`

Optional before launch:
- Playwright smoke check for home, catalog, design, order request, profile, admin.
- Lighthouse/performance pass in production mode.
