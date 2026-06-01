# ESRA Technical Collaborations

This is the Next.js app behind the ESRA technical collaborations forms:

- `https://esra-form.vercel.app/` - request form for hardware, compute, manufacturing, sponsoring, and hardware loan offers
- `https://esra-form.vercel.app/inventory` - club inventory submission form

The app is deployed on Vercel and uses Notion as the live data backend. Source code and static assets are in this repository; secrets and live data are not.

## Agent Handoff

Start here if you are taking over the project.

1. Clone the repo and install dependencies:
   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```
2. Put a valid `NOTION_TOKEN` in `.env.local`. The sample data source IDs in `.env.example` point to the current Notion data sources.
3. Open `http://localhost:3000`.
4. Do not commit `.env.local`, `.vercel`, `.next`, or `node_modules`.
5. When changing Notion-related behavior, verify both locally and against the live `/api/options` endpoint after deploy.

## Current Architecture

- Framework: Next.js App Router
- UI: plain React components plus global CSS
- Backend routes: Next.js route handlers under `app/api`
- Data backend: Notion REST API, no Notion SDK
- Static assets: tracked under `public/`
- Deployment: Vercel production alias `esra-form.vercel.app`

## Important Files

- `app/page.tsx` - main request form
- `app/inventory/page.tsx` - club inventory form
- `app/api/options/route.ts` - reads live Notion options for dropdowns/lists
- `app/api/submit/route.ts` - creates request rows in Notion
- `app/api/inventory/route.ts` - creates club inventory rows in Notion
- `app/api/upload/route.ts` - uploads files to Notion file uploads
- `lib/notion.ts` - Notion REST helpers, data source IDs, and property builders
- `lib/cities.ts` - city list used by the form
- `app/globals.css` - global styling
- `app/AsciiBackground.tsx` - animated background using `public/europe-src.png`
- `public/esra-logo.png` - ESRA logo used in both forms
- `public/europe-src.png` - source image for the ASCII background

## Notion Setup

The live databases/data sources are under the Notion page `Core Data Layer`.

The current app data sources are:

| Purpose | Env var | Current data source ID | Notes |
| --- | --- | --- | --- |
| Requests | `REQUESTS_DS` | `ac05a66d-eb5a-4fce-9bf5-f41c061c6590` | Form submissions are written here. |
| Hardware catalog | `CATALOG_DS` | `207e23c1-8145-445d-8d40-2fd394e62d25` | ESRA-owned/requestable hardware. |
| Club inventory | `INVENTORY_DS` | `6fde129e-7cd3-46dc-8bd9-d724abda9685` | Club-owned equipment and manufacturing services. |
| Partnerships | `PARTNERSHIPS_DS` | `9634147a-5a23-43a3-9498-ff150d9fd945` | Used for the sponsoring/partnership dropdown. |

Important: the old Technical Collaboration `Sponsors` database is stale. The app should use Core Data Layer `Partnerships`, via `PARTNERSHIPS_DS`. Do not reintroduce `SPONSORS_DS` unless there is a deliberate migration plan.

## Notion Permissions

The Notion integration must be connected to:

- `Core Data Layer`
- Requests
- Hardware Catalog
- Club Inventory
- Partnerships

If an API route returns a Notion 403 or an empty search result, first check that the Notion integration has access to the target page/database.

## Runtime Behavior

`GET /api/options` returns:

- `hardware` from Hardware Catalog where `Available for request` is checked
- `clubHardware` from Club Inventory where `Loanable` is checked
- `manufacturing` from Club Inventory where `Offering` contains `Offer as a service`
- `sponsors` from Partnerships

`POST /api/submit` creates a row in Requests. For sponsoring requests, selected partnerships are written to the Requests property `Partnership interest`.

`POST /api/inventory` creates one Club Inventory row per submitted item.

## Environment Variables

Required in local `.env.local` and Vercel production:

```bash
NOTION_TOKEN=secret_xxx
REQUESTS_DS=ac05a66d-eb5a-4fce-9bf5-f41c061c6590
CATALOG_DS=207e23c1-8145-445d-8d40-2fd394e62d25
INVENTORY_DS=6fde129e-7cd3-46dc-8bd9-d724abda9685
PARTNERSHIPS_DS=9634147a-5a23-43a3-9498-ff150d9fd945
```

`.env.example` is committed. `.env.local` is ignored and must stay uncommitted.

## Deployment

The app is linked to Vercel through local `.vercel` metadata, but that folder is ignored.

Useful commands:

```bash
npm run dev
npm run build
vercel deploy --prod --yes
```

After deploying, verify:

```bash
curl -sS https://esra-form.vercel.app/api/options
```

The sponsoring list should show Core Data Layer Partnerships such as `ProjectX`, `EMBARK.Law`, and `MicroAGI`, not the stale old Sponsors entries.

## GitHub

Remote:

```bash
git@github.com:katari16/esra-technical-collaborations.git
```

Tracked content includes all app source and static image assets needed to build the website. Not tracked by design:

- `.env.local`
- `.vercel`
- `.next`
- `node_modules`
- Notion live data
- Notion token / Vercel secrets

## Recent State Notes

- The project folder was moved to `Documents/esra/esra-form`.
- Old databases were moved from the Technical Collaboration page into Core Data Layer.
- The old Technical Collaboration page was cleaned of stale visible child blocks.
- TU Vienna equipment was added to Club Inventory:
  - CNC Machine
  - Lathe
  - Metal laser cutter
- These TU Vienna items are marked `Offer as a service`, so they appear in the manufacturing dropdown.

## Common Changes

To add a new dropdown backed by Notion:

1. Ensure the Notion integration has access to the database.
2. Add the data source ID to `lib/notion.ts`.
3. Query it in `app/api/options/route.ts`.
4. Add the client-side state and UI in `app/page.tsx`.
5. If submitted, map it to a Requests property in `app/api/submit/route.ts`.

To add a new request field:

1. Add field state in `app/page.tsx`.
2. Render the input in the relevant request kind section.
3. Extend the `Body` type in `app/api/submit/route.ts`.
4. Write the value to the matching Notion property using helpers from `lib/notion.ts`.
5. Confirm the Notion property type matches the helper.

## Pitfalls

- Notion relation properties point to data source IDs, not always database/page IDs.
- Vercel environment variables can override code defaults. The app intentionally uses `PARTNERSHIPS_DS` instead of legacy `SPONSORS_DS`.
- The Notion API version is pinned in `lib/notion.ts` as `2025-09-03`.
- Do not prune old Notion data until the live app has been verified after deploy.
