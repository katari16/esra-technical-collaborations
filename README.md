# ESRA Technical Collaborations

Next.js app for ESRA technical collaboration requests, inventory submissions, and Notion-backed options.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Runtime Notion access is configured through environment variables, not committed secrets:

- `NOTION_TOKEN`
- `REQUESTS_DS`
- `CATALOG_DS`
- `INVENTORY_DS`
- `PARTNERSHIPS_DS`

The source code and image assets are in this repository. The production secrets live in Vercel, and the live data lives in Notion.

## Important Files

- `app/page.tsx` - main request form
- `app/inventory/page.tsx` - club inventory form
- `app/api/options/route.ts` - reads Notion options
- `app/api/submit/route.ts` - writes requests to Notion
- `app/api/inventory/route.ts` - writes inventory rows to Notion
- `lib/notion.ts` - Notion REST helpers and data source IDs
- `public/` - tracked image and static assets
