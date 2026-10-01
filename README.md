# EquiCalc

**Smarter calculations. Clearer investing decisions.**

EquiCalc is an investor calculation workspace for Indian equity investors. Enter a position, understand its cost, value and recovery, explore scenarios, and save useful calculations in your browser. No account, backend, market-data API or paid service is required.

## Features

- Quick Position dashboard with investment, market value, P&L, return, break-even and recovery.
- 16 functional calculators: Average Down, Stock Average, Break Even, Profit & Loss, Target Return, CAGR, Dividend, Position Size, Risk / Reward, Partial Sell, Bonus, Stock Split, Rights Issue, P/E, Market Cap and Investment Growth.
- Average Down includes budget and target-average modes, before/after comparison, whole-share rounding and an engine-driven scenario table.
- Multi-lot weighted averages, reverse P/E/EPS calculations, withdrawal sizing, and year-by-year investment projections.
- Explicit opt-in reuse of a shared position. Calculators start empty; examples are available on demand. The dashboard starts with a clearly labelled editable example when no position exists.
- Searchable directory, favourites, eight recent tools, saved scenarios and calculation history.
- Save, reopen, rename, duplicate and delete scenarios. Copy results or use the native share sheet, with a manual-copy fallback when clipboard access is unavailable.
- Light, dark and system themes; Indian number grouping; optional K/L/Cr currency display.
- Desktop sidebar, mobile bottom navigation, accessible labels, keyboard focus styles and reduced-motion support.
- Settings for history opt-out and confirmed local-data deletion; About, Disclaimer and 404 pages.

## Technology

The existing Angular CLI workspace is preserved: Angular 20 (20.3.33 installed), TypeScript 5.8, standalone components, Signals, typed Reactive Forms, lazy Angular Router routes and SCSS. The generated Zone.js setup remains in place. Unit tests use the existing Jasmine/Karma configuration. There is no SSR or added runtime dependency, UI library, chart library or state-management framework.

## Development

Use Node.js 22.12+ (verified with 22.18.0) and npm.

```sh
npm ci
npm start
```

Open `http://localhost:4200`. To use another port:

```sh
npm start -- --port 4300
```

## Commands and testing

```sh
npm test                                    # interactive Jasmine/Karma runner
npm test -- --watch=false --browsers=ChromeHeadless
npm run build                               # optimized production build
npm run watch                               # development build watcher
npx tsc --noEmit -p tsconfig.spec.json        # strict TypeScript checks
```

Chrome or Chromium must be installed for headless tests. Set `CHROME_BIN` to its executable when it is not discovered automatically. ESLint was not configured in the generated project, so there is no lint script.

Tests cover every calculator, reference mathematical values, positive/negative/zero cases, invalid inputs, impossible targets, fractional entitlements, floating-point boundaries and numerical limits. Component and state tests cover purchase rows, mode switching, shared-position opt-in, examples/reset, saving, favourites, history deduplication/opt-out, theme persistence and corrupted or unavailable browser storage.

Browser verification covers all example calculators and primary workflows, including search, save/reopen and theme switching. Responsive checks were performed at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 pixels. Scenario and projection tables scroll locally on narrow screens.

## Production build

`npm run build` outputs static files to `dist/EquiCalc/browser/`. Serve that directory over HTTPS with a fallback to `index.html` for client-side routes, such as `/calculators/average-down`. The application requires no API server. HTTPS enables browser clipboard and Web Share features where supported.

The initial production bundle is approximately 317 kB raw / 91 kB estimated transferred, within the original Angular budgets. Routes load calculator, dashboard and collection code lazily. Fonts and SVG icons are local/system assets; no external font or image requests are needed.

## Architecture

```text
src/app/
  core/
    config/         Single typed calculator registry
    models/         Structured snapshots, metrics and future market-data interfaces
    state/          Focused Signal stores: position, theme, preferences,
                    favourites, recent, saved and history
    storage/        Versioned browser storage and persisted-data validation
    utilities/      Central currency/number formatting
  domain/
    calculations/   Framework-independent pure TypeScript formulas and tests
    models/         Investor position and purchase-lot types
  shared/components/
                    SVG icons, financial fields, calculator cards,
                    result panel and save/copy/share controls
  layout/           Responsive application shell
  features/
    dashboard/      Overview and independent Quick Position component
    calculators/    Directory, typed input/content configuration, result mapping,
                    calculator page, averaging comparison and supplemental tables
    saved/          Saved calculations and dated history groups
    settings/       Appearance, display and local-data controls
    information/    About, disclaimer and 404
```

Calculator metadata is defined once in `core/config/calculators.ts` and powers routes, navigation, cards, search and related tools. Shared calculator layouts use a small typed field/mode configuration; the flagship comparison and scenario explorer are focused child components. UI adapters turn domain results into structured display metrics.

To add a calculator, implement and test a pure function, add registry metadata and field/help configuration, then map its structured result in `features/calculators/calculate.ts`. The domain layer imports no Angular APIs and can be reused in workers, a mobile application or a future service.

## Calculation conventions

- Use full JavaScript numerical precision internally and round primarily for display. Results outside the supported numerical range are rejected rather than rendered as NaN or Infinity. JavaScript floating-point arithmetic is not a decimal accounting ledger.
- Budget-based purchases floor whole shares, with a tolerance only for floating-point noise at an exact boundary. Actual capital used and unused budget are separate values.
- Target-average mode rounds shares up to meet or better the requested average, and reports the achieved average and difference. A target at or below the new purchase price is unreachable.
- The reference position (100 shares at 500, current price 350, additional budget 20,000) buys **57 shares**, uses **19,950**, leaves **50**, and produces an average of **445.541401…** and recovery of **27.297543…%**. These exact results supersede the approximate numbers in the product brief.
- Recovery is zero once break-even has been reached. At a current price of zero it is explicitly undefined, never shown as an infinite percentage.
- Profit/loss returns divide net P&L by the purchase value; optional charges are deducted once. Other tools exclude charges unless stated.
- Position Size models a long position without leverage and is capped by available capital as well as the risk budget. Stops do not guarantee execution.
- Partial Sell uses average cost, not tax-lot accounting. Withdrawal mode rounds up to enough whole shares and rejects sales beyond the holding.
- Bonus and rights calculations floor whole-share allotments and display fractional entitlements separately. Stock Split shows theoretical quantity, including possible fractional shares. Actual issuer terms may differ.
- P/E is undefined at zero EPS and marked not meaningful for negative earnings. No valuation classifications are made.
- Investment Growth uses an effective annual return converted to a monthly rate, end-of-month contributions and duration rounded to the nearest month, capped at 100 years. All projections are assumptions, excluding inflation, fees and taxes.

## Local persistence

Only `StorageService` accesses local storage. Keys use the `equicalc.v1.` namespace. Malformed JSON and incompatible shapes safely fall back to defaults. Storage failures keep the session usable and show a persistence warning.

Saved calculations are capped at 200, history at 100 and recent tools at eight unique entries. History records complete results after 1.2 seconds of inactivity or an explicit calculate/save/share action; consecutive identical results are deduplicated. Users can disable history in Settings.

There is no cloud sync, account recovery or export backup. Browser-data deletion and private-browsing lifecycles can remove stored information. Destructive UI actions require confirmation and clearing EquiCalc data does not clear other applications’ keys.

## Future roadmap

The `MarketDataProvider` interface is reserved for future company search and quotes. It makes no network calls today. Future phases can build portfolios, transactions, watchlists, corporate events and company research around the existing pure domain layer. PWA installation and authentication are not implemented in V1.

## Disclaimer

EquiCalc provides mathematical and informational tools only. It does not provide investment advice, securities recommendations or predictions. Results depend on user inputs and should be independently verified where financial decisions depend on them. Taxes, charges and corporate-action rules may change.
