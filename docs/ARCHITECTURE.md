# Architecture

## Folders

- `core`: API access, data models, fixtures, storage and CSV export.
- `features`: dashboard, drivers, fleet, reviews and My work.
- `shared`: reusable UI components and styles.
- `e2e`: browser tests.

## State

NgRx Store holds driver data, filters and saved reviews. Facades expose selectors
as Signals and provide methods for dispatching actions. Effects handle API calls,
storage and notifications; reducers only update state.

Local UI state stays in components. Computed Signals derive display values.
The review editor uses Signal Forms and a linkedSignal draft, so edits can be
cancelled before saving. Saved reviews only change after storage succeeds.

## Data and navigation

HttpClient requests go through a mock interceptor. It returns fictional data or
an error selected in the UI. A real API would replace this boundary and require
response validation and server-side access checks.

Pages are standalone components loaded through the router. Store and Effects
are registered at the application level. A navigation guard warns about unsaved
review changes.

## Tests

Vitest covers calculations, state updates, storage and components. Playwright
checks user flows and responsive layouts in Chromium and WebKit.
