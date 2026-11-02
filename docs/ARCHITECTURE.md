# Architecture notes

## Data flow

```
App.tsx
 └─ useHashView()  → which view is open (#/overview, #/stations, #/orders, #/quality)
 └─ usePolling(fetchSnapshot, 10 s)
      └─ api.getStations / getWorkOrders / getDefects   (in parallel, Promise.all)
           ├─ createHttpApi(VITE_API_URL) → requestJson() → fetch → REST API
           └─ createDemoApi()             → in-memory copy of src/data/seed.json
 └─ summarize(...), buildAlarms(...)  → nav badges, KpiCards, AlarmList
 └─ AppHeader, NavRail, StatusBar        (app shell, always visible)
 └─ one view at a time (props only, no fetching inside):
      overview → KpiCards, LineFlow, AlarmList, OrdersDue
      stations → StationGrid
      orders   → WorkOrderTable
      quality  → DefectPanel
```

- **One source of truth:** App holds the latest snapshot; components receive data as props and call `onCreate` / `onClose` callbacks. After a mutation App calls `refresh()` so every view shows the server's version.
- **Swappable backend:** `LineApi` is an interface. `createApiFromEnv()` picks the HTTP version when `VITE_API_URL` is set, otherwise the demo version. The demo simulates latency and small changes on each poll so the dashboard looks alive on GitHub Pages.

## Error handling

- `requestJson` turns every failure into an `ApiError`: HTTP status errors (with `status`), network errors and timeouts (`status: null`), and invalid JSON.
- `usePolling` keeps the last good data when a refresh fails, exposes `error`, and ignores results from requests that were aborted (unmount or a newer request).
- The form validates on submit, marks invalid fields with `aria-invalid`, links messages with `aria-describedby`, and announces success or failure in an `aria-live` region.

## Navigation

- Views are chosen from the URL hash, so there is no router dependency and GitHub Pages needs no rewrite rules. Unknown hashes (like the skip link's `#main`) are ignored.
- On a view change the page heading receives focus and the tab title updates, so screen-reader and keyboard users know the page changed.

## Visual design

- Follows ISA-101 HMI ideas: neutral grey for normal values, colour only for abnormal states (below OEE target, station down, critical defect), and a distinct shape for every status so colour is never the only signal.
- One set of design tokens (CSS custom properties) with light and dark workspace themes; the app chrome (header, nav rail, status bar) stays dark in both.

## Responsive layout

- Over 1080 px: full nav rail with labels. 761–1080 px: icon-only rail. 760 px and under: the rail becomes a bottom tab bar.
- The KPI strip goes from 5 columns to 3 to 2; the line flow from 6 nodes in a row (with conveyor connectors) to 3 and then 2.
- Under 760 px the station and work-order grids hide their headers and show each row as a card, using `data-label` attributes for the field names.
- Under 1000 px the defect list and the report form stack vertically.

## Tests

- `lib/metrics.test.ts`: OEE maths, zero/NaN guards, clamping, line summary, OEE tone, order state.
- `api/client.test.ts`: request building, POST body, HTTP error → `ApiError(404)`, network error → `ApiError(null)`. `fetch` is stubbed with Vitest.
- `components/DefectPanel.test.tsx`: validation messages, successful submit with trimmed text, show/hide closed defects.
- `lib/alarms.test.ts`: alarm list contents, severity order, closed defects skipped, overdue orders added.
- `hooks/useHashView.test.ts`: hash → view parsing, shift calendar boundaries.
