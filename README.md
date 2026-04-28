# TestBooking - Playwright + TypeScript

Automation assignment that covers:

1. UI car-rental flow on Booking Cars (New York JFK scenario).
2. Public REST API checks for `GET`, `POST`, `DELETE` on `https://api.restful-api.dev/objects`.

## Tech Stack

- TypeScript
- Playwright Test
- Chromium (UI project)

## Project Structure

- `tests/ui/search-car-jfk.ui.spec.ts` - UI flow: search car rental in New York (JFK), set dates, validate search results URL and result page markers.
- `tests/ui/pages/bookingCarsHomePage.ts` - UI page object for Booking Cars landing page actions.
- `tests/ui/pages/bookingCarsResultsPage.ts` - UI page object for results page checks and overlay handling.
- `tests/ui/fixtures/ui.fixture.ts` - shared Playwright fixtures for UI tests.
- `tests/api/api-tests.api.spec.ts` - API tests for public objects endpoint (`GET`, `POST`, `DELETE`).
- `tests/config/env.ts` - centralized environment values.
- `playwright.config.ts` - Playwright projects and runner configuration.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npx playwright install chromium
```

## Environment Variables

This project can run **without** a local `.env` file because defaults are defined in `tests/config/env.ts`.
So on a fresh machine, API tests work out of the box after install.

If you want to override defaults, use `.env.example` as a template:

```bash
cp .env.example .env
```

Available variables:

- `BOOKING_CARS_URL` (default already provided)
- `API_BASE_URL` (default: `https://api.restful-api.dev`)

### Minimum setup on another machine

1. Clone repo
2. Run `npm install`
3. Run `npx playwright install chromium`
4. Run API tests (`npm run test:api`)

No additional credentials are required for the API suite.

## Run Steps

### 1) Run all tests

```bash
npm test
```

### 2) Run API tests only

```bash
npm run test:api
```

### 3) Run only one API spec

```bash
npx playwright test --project=api tests/api/api-tests.api.spec.ts
```

### 4) Run UI test (headed)

```bash
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test --project=ui-chromium --headed --workers=1 tests/ui/search-car-jfk.ui.spec.ts
```

### 5) Open HTML report

```bash
npx playwright show-report
```

## What Is Validated

### API: `tests/api/api-tests.api.spec.ts`

- `GET /objects`
  - status is `200`
  - response body is an array

- `POST /objects`
  - status is `200`
  - response contains `id`, `name`, `data`
  - response data matches request payload values

- `DELETE /objects/{id}`
  - creates a dedicated object inside this test
  - deletes that object by ID
  - status is `200`
  - response message contains deleted object ID and `has been deleted`

### UI: `tests/ui/search-car-jfk.ui.spec.ts`

- opens Booking Cars landing page
- accepts cookie banner
- types pickup query and selects JFK option
- selects date range (pickup/dropoff)
- starts search
- verifies transition to search-results URL
- verifies URL search criteria
- checks visible result page markers

## Notes About UI Stability

UI test targets a real third-party website (`booking.com`) that can show anti-bot challenges, dynamic overlays, and changing DOM.
Because of that, occasional UI flakiness is expected and is environment-dependent.
API tests are deterministic and should be used as the stable part of the assignment validation.
