# PrintDrop Studio

Premium custom t-shirt design and drop-shipping platform. Design online, we print and ship in 72 hours.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + custom glass-morphism design system
- **Prisma** (schema ready, no DB connected yet)
- Deployed on Vercel

## Features

- 4-step design studio: color → size → design → checkout
- Live 3D shirt preview with drag-to-rotate
- AI-powered design suggestions
- Photo-to-design upload
- Group order flow
- Vibe mode (mood-based design picker)

## Local Dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx          # Landing page
  design/page.tsx   # Studio (4-step flow)
  checkout/page.tsx # Checkout
components/
  studio/           # StepShell, FormFields
  ShirtViewer3D     # 3D CSS viewer with drag + auto-spin
  TShirtMockup      # SVG shirt mockup
```

## Branch Strategy

- `main` — production
- `develop` — active development
