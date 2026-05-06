# Build vs. Buy

Monorepo-style workspace: B2B strategic build-vs-buy tooling (Next.js at repo root) plus the Harry analyst Worker in `harry/`.

The Next.js app helps companies decide whether to build custom software or buy vendor SaaS.

## Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (3-Year TCO bar chart)
- **Runtime**: Node.js 20
- **Port**: 5000

## Features

- Four interactive sliders: Time to Live, Annual SaaS Cost, App Criticality, Vibe Coding Appetite
- Dynamic Strategic Verdict (BUILD vs BUY) based on weighted scoring
- 3-Year TCO summary cards comparing custom build vs vendor SaaS
- Recharts bar chart showing year-by-year cost breakdown
- Lead capture form with unique session ID

## Project Structure

```
harry/               # Cloudflare Worker — Harry analyst agent (separate package.json)
src/
  app/
    layout.tsx       # Root layout with metadata
    page.tsx         # Main build-vs-buy page (client component)
    globals.css      # Tailwind base + custom slider styles
package.json
next.config.js
tailwind.config.ts
tsconfig.json
```

## Running

The app is configured to run on port 5000 via `npm run dev`. A workflow named "Start application" manages this process.

## Bugs Fixed

- **Hydration mismatch**: `SESSION_ID` was previously generated at module level with `Math.random()`, causing server/client content to differ. Fixed by moving to `useState` + `useEffect` so the ID is only generated on the client after mount.
