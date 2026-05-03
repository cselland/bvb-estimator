# Build vs. Buy Calculator

A B2B SaaS strategic decision tool that helps companies decide whether to build a custom software solution or buy a vendor SaaS product.

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
src/
  app/
    layout.tsx       # Root layout with metadata
    page.tsx         # Main calculator page (client component)
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
