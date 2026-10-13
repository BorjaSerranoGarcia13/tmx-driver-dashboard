# TMX Driver Dashboard

A small Angular demo for reviewing driver scores, benefit eligibility and fleet data.

## Features

- Portfolio summary and driver score history.
- Driver search, filters and sorting.
- Fleet overview and CSV export.
- Review notes and statuses saved in My work.
- Loading, empty and error states, with retry actions.
- Responsive layout and keyboard navigation.

## Stack

Angular 22, TypeScript, Signals, Signal Forms, NgRx Store and Effects, RxJS and CSS.
Tests use Vitest and Playwright.

## Run locally

Use Node.js 22 and npm 12.

```bash
npm ci
npm start
```

Open http://localhost:4200.

## Tests and build

```bash
npm run lint
npm run format:check
npm test -- --watch=false
npm run build
```

For browser tests:

```bash
npx playwright install chromium webkit
npm run test:e2e
```

`npm run verify` runs all the checks above once the browsers are installed.
The optional screenshot comparisons are skipped unless `TMX_STYLE_AUDIT_DIR`
and `TMX_STYLE_AUDIT_MODE` (`record` or `compare`) are set.

## Demo data

The app uses fictional drivers and a mocked HTTP API. The API response selector
lets you try success and error states without a backend.

My work stores notes in this browser's local storage. There is no login or
cross-device sync. Do not enter sensitive information.

CSV exports use semicolons and UTF-8 for Excel. Depending on your regional
settings, you may need to select the separator when importing.

## Project structure

See [Architecture](docs/ARCHITECTURE.md) for a short overview.

## Deployment

`npm run build` creates the static app in `dist/`. The host should serve
`index.html` for application routes. A Vercel configuration is included.
