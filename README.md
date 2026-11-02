# LineView: production line dashboard

A responsive web dashboard for a (fictional) medium-voltage switchgear assembly line: live station status and OEE, work-order progress, and a quality-defect log you can add to and close.

**Live demo:** https://yahyahelwa.github.io/lineview/ (runs on in-browser demo data)

![LineView on desktop](docs/screenshot-desktop.png)

<p>
  <img src="docs/screenshot-dark.png" alt="Dark theme" width="49%" />
  <img src="docs/screenshot-mobile.png" alt="Mobile layout" width="20%" />
</p>

## Why I built it

I'm a final-year Mechatronics Engineering student at Yıldız Technical University. In my workshop internship I wired control panels for a machinery manufacturer, and in my medical-device internship I documented how regulated teams track quality and CAPA. I wanted to build the kind of tool a factory digitalization team would ship: a screen that turns line data into something operators and engineers can act on.

## Features

- **Line KPIs:** line OEE (weighted by planned time), stations running, open/critical defects, order progress.
- **Stations:** OEE broken into availability, performance and quality; filter by status and search by station, ID or operator.
- **Work orders:** sortable table that turns into stacked cards on small screens; overdue and finished orders are marked.
- **Quality defects:** report a defect with client-side validation (POST), close it (PATCH), show/hide closed items.
- **Live refresh:** polls the API every 10 s, cancels in-flight requests with `AbortController`, keeps the last good data if a refresh fails and shows an error banner with retry.
- **Accessible and responsive:** semantic HTML, labelled form controls, `aria-live` status messages, keyboard focus styles, skip link, `prefers-reduced-motion`, light/dark theme that follows the OS and is remembered.

## Tech stack

React 19 · TypeScript · Vite · plain CSS (custom properties, grid, `color-mix`) · Vitest + Testing Library · json-server (mock REST API) · oxlint · GitHub Actions + GitHub Pages

## Run it locally

```bash
npm install
npm run dev          # demo mode: in-browser mock data, no backend needed
```

### With a real REST API

```bash
npm run api          # json-server on http://localhost:3001 (resets data from src/data/seed.json)
npm run dev:api      # in a second terminal: the app talks to the API (VITE_API_URL from .env.api)
```

Endpoints used: `GET /stations`, `GET /workOrders`, `GET /defects`, `POST /defects`, `PATCH /defects/:id`.

### Checks

```bash
npm test             # unit and component tests (Vitest)
npm run lint         # oxlint
npm run build        # type-check + production build
```

## How it is organised

```
src/
  api/client.ts        typed fetch wrapper: JSON, timeouts, ApiError with HTTP status
  api/lineApi.ts       LineApi interface + HTTP implementation + in-browser demo implementation
  hooks/usePolling.ts  fetch now, then every N ms; aborts on unmount
  lib/metrics.ts       OEE and line summary (pure functions, unit-tested)
  lib/validation.ts    defect form validation
  components/          KpiCards, StationGrid, WorkOrderTable, DefectPanel, StatusBadge
  data/seed.json       sample data shared by the demo mode and json-server
```

The UI only depends on the `LineApi` interface, so switching from the demo to a real backend is one environment variable (`VITE_API_URL`). More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How OEE is calculated

OEE = Availability × Performance × Quality

- Availability = run time ÷ planned time
- Performance = (ideal cycle time × units produced) ÷ run time
- Quality = good units ÷ units produced

Each factor is clamped to 0–100% so bad input never shows as NaN or 130%.

## How I used AI tools

I built this with an AI pair-programmer (Claude). I described the features and the data model, then reviewed every file, ran the tests and linter, and fixed what they caught (for example a test-cleanup bug and two React lint warnings about impure renders and state updates in effects). I can explain and change any part of the code.

## Ideas for next steps

- Charts of OEE over the shift (e.g. with a small SVG sparkline per station)
- Role-based views (operator vs. quality engineer)
- Real-time updates with Server-Sent Events instead of polling
- Port the UI to Siemens iX or Angular to compare frameworks

---

All data is made up. Not affiliated with any company.
