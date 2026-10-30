# Implementation Plan: Expense & Budget Visualizer

## Overview

The application is a single-page web app built with plain HTML, CSS, and Vanilla JavaScript (no frameworks). It is split into three files: `index.html` (single-column DOM structure), `css/styles.css` (theming and responsive layout), and `js/app.js` (all logic). Chart.js is loaded from a CDN; all state persists to LocalStorage with an in-memory fallback.

Implementation follows the design's one-way data flow: pure model functions mutate an in-memory `State` object, a storage adapter serializes/deserializes it, thin controllers wire DOM events to the model, and render functions project `State` onto the DOM and chart. Tasks build the model layer first (pure and testable without a DOM), then the storage adapter, then the render/controller glue that wires everything together. Property-based tests are optional and target the pure model layer; they load `fast-check` via CDN (or Node) with no build setup required.

## Tasks

- [ ] 1. Set up project structure and HTML/CSS foundation
  - [x] 1.1 Create `index.html` with the single-column DOM structure
    - Build the full HTML skeleton from the design: `<body data-theme>` wrapping a single `.app` column with the balance section (`#balance`, `#limit-input`), the entry form (`#name-input`, `#amount-input`, `#category-select`, submit), the new-category row (`#new-category-input`, `#add-category-btn`), `#validation-message`, the list section (`#sort-select`, `#transaction-list`), the chart section (`<canvas id="pie-chart">`), the monthly summary section (`#month-select`, `#monthly-total`, `#monthly-breakdown`), and `#theme-toggle`
    - Load `css/styles.css`, the Chart.js CDN script tag (`https://cdn.jsdelivr.net/npm/chart.js`), and `js/app.js` in that order
    - _Requirements: 1.1, 2.2, 6.2, 7.1, 9.1, 11.1, 11.4, 12.2_

  - [x] 1.2 Create `css/styles.css` with the theme system and responsive layout
    - Define CSS variables under `[data-theme="light"]` and `[data-theme="dark"]` selectors for all colors; style a single `.app` column with `max-width` and `width: 100%`
    - At viewport widths of 768px or below, stack every section vertically with no horizontal scroll; make `#transaction-list` a fixed-height scroll container
    - Add the `.over-limit` highlight style for `#balance`, the `.validation-message` style, and transaction row/delete-control styling
    - _Requirements: 8.2, 9.2, 11.1, 11.2, 11.3_

- [ ] 2. Implement the pure model layer
  - [x] 2.1 Implement `State` shape, `createInitialState`, input validation, and helpers
    - Define `DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"]` and the `AppState` shape; implement `createInitialState()` returning empty transactions, empty custom categories, `spendingLimit: null`, `theme: "light"`
    - Implement `validateTransactionInput({ name, amount, category })` returning the array of empty/invalid field names (whitespace-only name, empty/`NaN`/negative amount, empty category)
    - Implement `toMonthKey(epochMs)` returning `"YYYY-MM"` and `generateId()` using `crypto.randomUUID` with a counter/random fallback
    - _Requirements: 1.3, 1.4, 6.1_

  - [-] 2.2 Write property test for empty-field validation
    - **Property 2: Empty-field validation rejects submissions**
    - **Validates: Requirements 1.3**

  - [-] 2.3 Implement transaction operations and derived aggregates
    - Implement `addTransaction(state, { name, amount, category, now })`: validate, trim name, coerce amount via `Number`, set `id`/`month`/`createdAt`, return new State with the transaction appended
    - Implement `deleteTransaction(state, id)`: idempotently return new State with the matching transaction filtered out
    - Implement `totalBalance(state)` (sum of amounts), `categoryTotals(state)` (category -> sum map), and `monthlySummary(state, month)` returning `{ total, byCategory }` filtered to the given `"YYYY-MM"` month
    - _Requirements: 1.2, 2.3, 3.1, 4.2, 6.1, 6.3_

  - [~] 2.4 Write property test for transaction creation preserving input
    - **Property 1: Transaction creation preserves input**
    - **Validates: Requirements 1.2**

  - [~] 2.5 Write property test for delete idempotency
    - **Property 4: Delete removes the transaction and is idempotent**
    - **Validates: Requirements 2.3**

  - [~] 2.6 Write property test for total balance equals the sum
    - **Property 5: Total balance equals the sum of amounts after any state transition**
    - **Validates: Requirements 3.1, 3.2**

  - [~] 2.7 Write property test for category aggregation
    - **Property 6: Category aggregation matches a direct sum after any state transition**
    - **Validates: Requirements 4.2, 4.3**

  - [~] 2.8 Write property test for the creation month tag
    - **Property 8: Transactions carry the correct creation month**
    - **Validates: Requirements 6.1**

  - [~] 2.9 Write property test for monthly summary totals
    - **Property 9: Monthly summary totals match month-filtered sums**
    - **Validates: Requirements 6.3**

  - [~] 2.10 Implement sorting, custom categories, and spending limit logic
    - Implement `sortByAmount(transactions)` (non-decreasing copy) and `sortByCategory(transactions)` (alphabetical by `localeCompare`)
    - Implement `allCategories(state)` (defaults + custom) and `addCustomCategory(state, name)` (trim, skip empty, de-duplicate, return new State)
    - Implement `isOverLimit(state)` returning true only when `spendingLimit > 0` and the total balance exceeds it
    - _Requirements: 5.1, 7.2, 7.3, 8.1, 8.2, 8.3_

  - [~] 2.11 Write property test for sort by amount
    - **Property 10: Sort by amount produces a non-decreasing order**
    - **Validates: Requirements 7.2**

  - [~] 2.12 Write property test for sort by category
    - **Property 11: Sort by category produces alphabetical order**
    - **Validates: Requirements 7.3**

  - [~] 2.13 Write property test for custom category participation
    - **Property 7: Custom category persists and participates fully**
    - **Validates: Requirements 5.1, 5.2**

  - [~] 2.14 Write property test for spending limit highlight
    - **Property 12: Spending limit highlight reflects the total-vs-limit relationship**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [~] 3. Checkpoint - Verify the model layer
  - Verify the model functions behave correctly for add/delete/total/aggregation/sort/summary; ask the user if questions arise.

- [ ] 4. Implement the storage adapter
  - [~] 4.1 Implement `StorageAdapter` with LocalStorage and an in-memory fallback
    - Implement `_available()` probing `localStorage` with a set/get/remove cycle; on failure set `_useMemory = true`
    - Implement `load()`: return `createInitialState()` when unavailable or empty, otherwise `JSON.parse` and `normalizeState(parsed)`; on parse failure return `createInitialState()`
    - Implement `save(state)` via `serializeState(state)` to the single `expenseBudgetVisualizer` key, falling back to the in-memory map on error
    - Implement `normalizeState(parsed)` (default missing arrays/fields, drop malformed transactions, coerce `theme`) and `serializeState(state)` (strip transient fields)
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 4.2 Write property test for full state round-trip
    - **Property 14: Full application state round-trips through LocalStorage**
    - **Validates: Requirements 10.1, 10.2, 9.3**

- [ ] 5. Implement render functions, controllers, and wiring
  - [~] 5.1 Implement render functions and theme application
    - Implement `renderAll()`, `renderBalance()` (set formatted total, toggle `.over-limit` via `isOverLimit`), `renderTransactionList()` (apply current sort, build rows with name/amount/category and a delete control), `renderCategoryOptions()` (populate `#category-select` from `allCategories`), and `createTransactionRow(t)`
    - Implement `renderChart()`: compute labels/data from `categoryTotals`, create or update the Chart.js instance; guard when the global `Chart` or canvas context is unavailable and show a fallback message
    - Implement `applyTheme(theme)` setting `document.body.dataset.theme`
    - _Requirements: 2.1, 3.2, 4.1, 4.3, 5.2, 8.2, 9.2_

  - [~] 5.2 Write property test for transaction list rendering
    - **Property 3: Transaction list renders all entries**
    - **Validates: Requirements 2.1**

  - [~] 5.3 Implement controllers and wire all event listeners plus app initialization
    - Implement `handleSubmit`, `handleDelete(id)`, `handleSort(value)`, `handleAddCategory`, `handleSetLimit(value)`, `handleThemeToggle`, and a monthly-summary handler that renders total and per-category totals for the selected month
    - Wire DOM listeners: form submit, transaction-list delete (event delegation), sort-select change, add-category click, limit-input change, theme-toggle click, month-select change
    - On `DOMContentLoaded`: load state via `StorageAdapter`, apply theme, initialize the category options, sort selection, and chart, then `renderAll()`; save to `StorageAdapter` after every mutation
    - _Requirements: 1.1, 1.2, 2.3, 5.1, 6.2, 6.3, 7.1, 8.1, 9.1, 9.2, 9.3, 10.2_

  - [~] 5.4 Write property test for theme toggle
    - **Property 13: Theme toggle switches and double-toggle restores the original**
    - **Validates: Requirements 9.2**

- [~] 6. Final checkpoint - Verify the full application
  - Verify the app loads, restores state from LocalStorage, and that add/delete/total/chart/summary/sort/limit/theme flows work end to end; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirements for traceability; the design document holds the detailed component contracts.
- Property-based tests target the pure model layer and load `fast-check` via CDN (or Node). No test framework build/setup is required: each property is a standalone test file so the optional tests can run in parallel and independently of `js/app.js`.
- Checkpoints ensure incremental validation at the end of the model layer and after final wiring.
- Unit/example tests for UI-presence criteria (1.1, 1.4, 2.2, 6.2, 7.1, 9.1, 11.1, 11.2) and smoke tests (4.1, 11.3, 11.4, 12.2) from the design's testing strategy are covered by the implementation above and are optional, not separate required tasks.
- Cross-browser verification (12.1) is a manual integration check, not a coding task, so it is not listed as an implementation task.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.3", "2.2"] },
    { "id": 2, "tasks": ["2.10", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9"] },
    { "id": 3, "tasks": ["4.1", "2.11", "2.12", "2.13", "2.14"] },
    { "id": 4, "tasks": ["5.1", "4.2"] },
    { "id": 5, "tasks": ["5.3", "5.2"] },
    { "id": 6, "tasks": ["5.4"] }
  ]
}
```
