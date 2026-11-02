# Architecture notes

## Data flow

```
App.tsx
 └─ usePolling(fetchSnapshot, 10 s)
      └─ api.getStations / getWorkOrders / getDefects   (in parallel, Promise.all)
           ├─ createHttpApi(VITE_API_URL) → requestJson() → fetch → REST API
           └─ createDemoApi()             → in-memory copy of src/data/seed.json
 └─ summarize(...)  → KpiCards
 └─ StationGrid, WorkOrderTable, DefectPanel (props only, no fetching inside)
```

- **One source of truth:** App holds the latest snapshot; components receive data as props and call `onCreate` / `onClose` callbacks. After a mutation App calls `refresh()` so every view shows the server's version.
- **Swappable backend:** `LineApi` is an interface. `createApiFromEnv()` picks the HTTP version when `VITE_API_URL` is set, otherwise the demo version. The demo simulates latency and small changes on each poll so the dashboard looks alive on GitHub Pages.

## Error handling

- `requestJson` turns every failure into an `ApiError`: HTTP status errors (with `status`), network errors and timeouts (`status: null`), and invalid JSON.
- `usePolling` keeps the last good data when a refresh fails, exposes `error`, and ignores results from requests that were aborted (unmount or a newer request).
- The form validates on submit, marks invalid fields with `aria-invalid`, links messages with `aria-describedby`, and announces success or failure in an `aria-live` region.

## Responsive layout

- KPI cards and station cards use `grid-template-columns: repeat(auto-fit/auto-fill, minmax(...))`, so they reflow without media queries.
- Under 640 px the work-order table hides its header and shows each row as a card, using `data-label` attributes for the field names.
- Under 860 px the defect form and list stack vertically.

## Tests

- `lib/metrics.test.ts`: OEE maths, zero/NaN guards, clamping, line summary.
- `api/client.test.ts`: request building, POST body, HTTP error → `ApiError(404)`, network error → `ApiError(null)`. `fetch` is stubbed with Vitest.
- `components/DefectPanel.test.tsx`: validation messages, successful submit with trimmed text, show/hide closed defects.
