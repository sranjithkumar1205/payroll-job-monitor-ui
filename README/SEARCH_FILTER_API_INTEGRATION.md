# Search by Job Name & Filter by Status — API Integration

**Date:** March 25, 2026  
**Feature:** Server-side filtering for job name search and status filter  
**Files Changed:**
- `src/app/services/job.service.ts`
- `src/app/components/job-table/job-table.component.ts`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Original Code — What It Was Doing](#2-original-code--what-it-was-doing)
3. [Approach 1 — Tried, Did Not Work](#3-approach-1--tried-did-not-work)
4. [Approach 2 — Tried, Partially Worked](#4-approach-2--tried-partially-worked)
5. [Approach 3 — Final Working Solution](#5-approach-3--final-working-solution)
6. [Step-by-Step Code Walk-Through](#6-step-by-step-code-walk-through)
7. [What Was Newly Added](#7-what-was-newly-added)
8. [What Was Removed](#8-what-was-removed)
9. [Before vs After Comparison](#9-before-vs-after-comparison)
10. [API Contract](#10-api-contract)
11. [Data Flow Diagram](#11-data-flow-diagram)
12. [Key Concepts Used](#12-key-concepts-used)
13. [Testing This Feature](#13-testing-this-feature)

---

## 1. Problem Statement

The job table had two filter controls visible in the UI:
- **Search by Job Name** — a text input
- **Filter by Status** — a dropdown with All / Running / Completed / Failed

Both controls were wired up and visually working. However, they were **only filtering
the data already loaded in the browser** — specifically, only the rows on the current
page. They were **not sending any filter parameters to the backend API**.

### Consequences of Client-Side Only Filtering

| Scenario | What Happened |
|---|---|
| User types "Payroll" in search | Only the 10 rows on the current page were searched — jobs on other pages were invisible |
| User selects "Failed" status | Only failed jobs from the current 10 rows showed — failed jobs on other pages were missed |
| `totalElements` (paginator count) | Never changed when filters were applied — paginator always showed the unfiltered total |
| Accuracy | If there were 200 jobs but only 10 loaded per page, filtering was 95% inaccurate |

---

## 2. Original Code — What It Was Doing

### `job.service.ts` — Original `getJobs()` signature

```typescript
// ORIGINAL — no filter params
getJobs(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'startTime',
  sortDir: 'asc' | 'desc' = 'desc'
): Observable<Page<JobExecution>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);
  // No jobName or status param — filters were simply never sent to backend
  return this.http.get<Page<JobExecution>>(this.apiUrl, { params });
}
```

URL produced: `GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc`  
No filter params in the URL — backend returned all jobs unfiltered every time.

---

### `job-table.component.ts` — Original filter handling

```typescript
// ORIGINAL — filter signals did not exist
// The effect() only tracked pagination and sort:
effect(() => {
  this.loadJobs(
    this.currentPage(),
    this.pageSize(),
    this.sortBy(),
    this.sortDir()
    // search and status were NOT signals — they were not tracked here
  );
});

// In ngOnInit: filters only reset the page, they did not trigger a new API call
this.searchControl.valueChanges.pipe(startWith('')).subscribe(() => {
  this.currentPage.set(0);   // ← only reset page
  // no signal update, no filter param forwarded
});
```

```typescript
// ORIGINAL loadJobs() — filtered in the browser after API response
private loadJobs(page, size, sortBy, sortDir): void {
  this.jobService.getJobs(page, size, sortBy, sortDir).subscribe({
    next: (response) => {
      let filtered = response.content;  // ← only the rows on current page

      // Client-side text match — only searched within current page's 10 rows
      const search = this.searchControl.value || '';
      if (search) {
        filtered = filtered.filter(job =>
          job.jobName.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Client-side status match — only within current page's 10 rows
      const status = this.statusControl.value || '';
      if (status) {
        filtered = filtered.filter(job => job.status === status);
      }

      this.dataSource.data = filtered;
    }
  });
}
```

---

## 3. Approach 1 — Tried, Did Not Work

### Idea: Rely on `currentPage.set(0)` to trigger a reload when filters change

The existing `effect()` re-ran whenever any signal it read changed. The existing filter
subscriptions already called `this.currentPage.set(0)`. The assumption was:

> "Setting `currentPage` to 0 will re-trigger the effect, which calls `loadJobs()`
> with the new filter values read from `searchControl.value` directly inside `loadJobs()`."

**Why it failed:**

Angular Signals `effect()` only re-runs when a **signal it read** changes its value.
If the user was already on page 0 and typed a search term, `currentPage.set(0)` was
setting the signal to `0` — **its existing value**. Angular signals skip the re-run
when the new value equals the old value. So no reload happened.

```
User on page 0 → types "Payroll"
→ currentPage.set(0)      ← signal already = 0, no change detected
→ effect() does NOT re-run
→ loadJobs() is NOT called
→ table stays showing old unfiltered results
```

Even when it did re-run (e.g. on first keystroke from a non-zero page), `loadJobs()`
still read `searchControl.value` directly inside the function — but those FormControl
values are **not Angular signals**, so changes to them do not trigger the `effect()`.

**Conclusion:** This approach was fundamentally broken because FormControl values are
not tracked by Angular's signal system.

---

## 4. Approach 2 — Tried, Partially Worked

### Idea: Add `debounceTime` to search + pass form values into `loadJobs()` directly

The second attempt added `debounceTime(300)` and `distinctUntilChanged()` to the search
subscription and tried passing `searchControl.value` directly as a parameter to
`loadJobs()` and then to `getJobs()`.

```typescript
// Attempt 2
this.searchControl.valueChanges.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged()
).subscribe((value) => {
  this.currentPage.set(0);
  this.loadJobs(0, this.pageSize(), this.sortBy(), this.sortDir(), value ?? '', this.statusControl.value ?? '');
});
```

**What it fixed:**
- Search now sent `jobName` to the API when a value was present.
- `debounceTime(300)` prevented a request on every single keystroke.

**What it broke / did not fix:**

1. **Double API calls** — The `effect()` also fired because `currentPage.set(0)` changed
   the signal, so two simultaneous API calls were triggered: one from the direct
   `loadJobs()` call in the subscription, and one from the `effect()`. Race conditions
   could cause stale data to overwrite fresh data.

2. **Status filter** — When status changed, `currentPage.set(0)` triggered the `effect()`
   but the `statusControl.value` was read inside `loadJobs()` which was called by the
   `effect()` — and the `effect()` did not track `statusControl`. So if already on
   page 0, the status filter change caused no reload.

3. **Out-of-sync state** — `loadJobs()` was called from two different places
   (subscription + effect) with different parameters, making it hard to follow the code
   and creating timing bugs.

**Conclusion:** Calling `loadJobs()` from both the subscription and the effect created
duplicate calls and race conditions. A cleaner contract was needed.

---

## 5. Approach 3 — Final Working Solution

### Core idea: Make filter values Angular signals so the `effect()` tracks them

The cleanest solution was to:

1. **Add two new signals** — `searchTerm` and `statusFilter` — in `job-table`.
2. **Update signal values** in the FormControl subscriptions instead of calling
   `loadJobs()` directly.
3. **Include both new signals in the `effect()` call** so any filter change,
   pagination change, or sort change all flow through one single code path.
4. **Pass the signal values as parameters** to `getJobs()` in the service.
5. **Conditionally append query params** in the service — only include `jobName` and
   `status` in the URL when they are non-empty.
6. **Remove client-side filtering entirely** — the backend now owns filtering.

This way:
- There is exactly **one place** (`effect()`) that calls `loadJobs()`.
- There is exactly **one place** (`loadJobs()`) that calls `getJobs()`.
- Angular's signal system automatically detects which signals changed and triggers
  a reload only when needed.

---

## 6. Step-by-Step Code Walk-Through

### Step 1 — Add `jobName` and `status` parameters to `getJobs()` in the service

**File:** `src/app/services/job.service.ts`

```typescript
// BEFORE
getJobs(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'startTime',
  sortDir: 'asc' | 'desc' = 'desc'
): Observable<Page<JobExecution>>

// AFTER
getJobs(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'startTime',
  sortDir: 'asc' | 'desc' = 'desc',
  jobName: string = '',    // ← NEW: job name search term from search box
  status: string = ''      // ← NEW: status filter value from dropdown
): Observable<Page<JobExecution>>
```

Both new parameters have empty string defaults so all existing callers of `getJobs()`
(e.g. `job-summary`'s old code, `getJobs()` with 0 args) remain fully backward compatible
without any changes.

---

### Step 2 — Conditionally append filter params to `HttpParams`

**File:** `src/app/services/job.service.ts`

```typescript
let params = new HttpParams()
  .set('page', page.toString())
  .set('size', size.toString())
  .set('sortBy', sortBy)
  .set('sortDir', sortDir);

// NEW — only add jobName to the URL if the user actually typed something
const trimmedJobName = jobName.trim();
if (trimmedJobName) {
  params = params.set('jobName', trimmedJobName);
}

// NEW — only add status to the URL if a specific status was selected
if (status) {
  params = params.set('status', status);
}
```

**Why conditional, not always-present?**

If we always appended `&jobName=&status=`, the backend would receive empty string
values and would need to handle them carefully. Some Spring Boot backends treat
an empty `@RequestParam` as a present value and attempt to apply an empty filter,
which could cause unexpected SQL behavior or errors.

By only including the param when it has a value, the URL is clean:
- No filters: `GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc`
- Name only: `GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll`
- Both: `GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll&status=FAILED`

**Why `trim()` on `jobName`?**

Prevents a search for `"  "` (whitespace only) from being sent as a non-empty filter
param. After `trim()`, a whitespace-only input becomes `""` which fails the `if` check
and is correctly ignored.

---

### Step 3 — Add two filter signals to `job-table`

**File:** `src/app/components/job-table/job-table.component.ts`

```typescript
// NEW signals — these ARE tracked by Angular's effect() system
/** Search term sent to the backend as jobName query parameter. */
searchTerm = signal('');

/** Selected status sent to the backend as status query parameter. */
statusFilter = signal('');
```

**Why signals instead of reading `searchControl.value` directly?**

Angular's `effect()` only re-runs when **signals it read** change. Plain class
properties and RxJS FormControl values are not signals — changing them does not
wake up the `effect()`. By storing filter values in signals, we plug them into the
same reactive graph as the pagination and sort signals, giving us one unified
trigger mechanism.

---

### Step 4 — Include filter signals in the `effect()` call

**File:** `src/app/components/job-table/job-table.component.ts`

```typescript
// BEFORE — effect only tracked 4 signals
effect(() => {
  this.loadJobs(
    this.currentPage(),
    this.pageSize(),
    this.sortBy(),
    this.sortDir()
  );
});

// AFTER — effect now tracks 6 signals
effect(() => {
  this.loadJobs(
    this.currentPage(),
    this.pageSize(),
    this.sortBy(),
    this.sortDir(),
    this.searchTerm(),    // ← NEW: read signal → effect re-runs when this changes
    this.statusFilter()   // ← NEW: read signal → effect re-runs when this changes
  );
});
```

Now any change to any of the 6 signals — page, size, sort field, sort direction,
search term, or status filter — will automatically re-run the effect and trigger a
new API call with the correct parameters.

---

### Step 5 — Update filter subscriptions to set signals instead of just resetting page

**File:** `src/app/components/job-table/job-table.component.ts`

**Search control subscription — Before:**
```typescript
// BEFORE — only reset page, no signal update
this.searchControl.valueChanges.pipe(
  startWith('')
).subscribe(() => {
  this.currentPage.set(0);   // only this — no filter value forwarded
});
```

**Search control subscription — After:**
```typescript
// AFTER — debounce, deduplicate, then update signal
this.searchControl.valueChanges.pipe(
  startWith(''),
  debounceTime(300),          // ← NEW: wait 300ms after last keystroke before firing
  distinctUntilChanged()      // ← NEW: skip if value hasn't actually changed
).subscribe((value) => {
  this.searchTerm.set(value?.trim() ?? '');   // ← NEW: update signal with trimmed value
  this.currentPage.set(0);
});
```

**`debounceTime(300)` explained:**  
Without debounce, every single keystroke would immediately update `searchTerm` signal,
which would trigger the `effect()`, which would fire `loadJobs()`, which would hit the
API. For a user typing "payroll" (7 characters), that would be 7 API calls in under a
second. `debounceTime(300)` groups rapid keystrokes and only emits after the user pauses
for 300ms, typically resulting in 1 API call per search term.

**`distinctUntilChanged()` explained:**  
If the user types "a" then immediately deletes it (back to ""), the value is `""` twice
in a row. `distinctUntilChanged()` detects this and suppresses the duplicate emission,
preventing an unnecessary reload.

---

**Status control subscription — Before:**
```typescript
// BEFORE — only reset page
this.statusControl.valueChanges.pipe(
  startWith('')
).subscribe(() => {
  this.currentPage.set(0);
});
```

**Status control subscription — After:**
```typescript
// AFTER — update signal, then reset page
this.statusControl.valueChanges.pipe(
  startWith('')
).subscribe((value) => {
  this.statusFilter.set(value ?? '');   // ← NEW: update signal
  this.currentPage.set(0);
});
```

No `debounceTime` here because status is a dropdown — the user either selects a value
or not. There is no "typing" scenario that produces rapid emissions.

---

### Step 6 — Update `loadJobs()` signature and pass filters to `getJobs()`

**File:** `src/app/components/job-table/job-table.component.ts`

```typescript
// BEFORE
private loadJobs(page: number, size: number, sortBy: string, sortDir: 'asc' | 'desc'): void {
  this.jobService.getJobs(page, size, sortBy, sortDir).subscribe({ ... });
}

// AFTER
private loadJobs(
  page: number,
  size: number,
  sortBy: string,
  sortDir: 'asc' | 'desc',
  searchTerm: string,   // ← NEW param
  status: string        // ← NEW param
): void {
  this.jobService.getJobs(page, size, sortBy, sortDir, searchTerm, status).subscribe({ ... });
}
```

`loadJobs()` simply passes the values through. The values come from signals (read by the
`effect()`), which guarantees they are always the latest up-to-date values.

---

### Step 7 — Remove client-side filtering from `next` callback

**File:** `src/app/components/job-table/job-table.component.ts`

```typescript
// BEFORE — filtered in browser after receiving API response
next: (response: Page<JobExecution>) => {
  this.totalElements.set(response.totalElements);
  this.isEmpty.set(response.empty || response.totalElements === 0);

  let filtered = response.content;

  const search = this.searchControl.value || '';
  if (search) {
    filtered = filtered.filter(job =>
      job.jobName.toLowerCase().includes(search.toLowerCase())
    );
  }

  const status = this.statusControl.value || '';
  if (status) {
    filtered = filtered.filter(job => job.status === status);
  }

  this.dataSource.data = filtered;  // ← was showing partially filtered data
  this.isLoading.set(false);
}

// AFTER — backend already filtered; use response content directly
next: (response: Page<JobExecution>) => {
  this.totalElements.set(response.totalElements);  // ← now reflects filtered total
  this.isEmpty.set(response.empty || response.totalElements === 0);
  this.dataSource.data = response.content;          // ← already filtered by backend
  this.isLoading.set(false);
}
```

**Why removing client-side filtering is correct:**  
The backend now returns only the jobs that match the filters. The `totalElements`
in the response already reflects the filtered count, so the paginator shows the
correct number of pages for the filtered result set. Client-side re-filtering would
be redundant and could interfere with `totalElements` (since it doesn't adjust
`totalElements` when filtering locally).

---

### Step 8 — Update `loadJobs()` JSDoc comment

The method comment was updated to reflect the new parameters:

```typescript
/**
 * Loads a single page of jobs from the backend via JobService.
 *
 * Called automatically by the constructor effect() whenever currentPage,
 * pageSize, sortBy, sortDir, searchTerm, or statusFilter signals change.
 */
```

---

## 7. What Was Newly Added

### In `src/app/services/job.service.ts`

| What | Type | Purpose |
|---|---|---|
| `jobName: string = ''` param on `getJobs()` | Function parameter | Receives search term from component |
| `status: string = ''` param on `getJobs()` | Function parameter | Receives status filter from component |
| `const trimmedJobName = jobName.trim()` | Local variable | Sanitise input before appending to URL |
| `if (trimmedJobName) params = params.set('jobName', ...)` | Conditional param | Adds jobName to query string when non-empty |
| `if (status) params = params.set('status', ...)` | Conditional param | Adds status to query string when non-empty |

### In `src/app/components/job-table/job-table.component.ts`

| What | Type | Purpose |
|---|---|---|
| `searchTerm = signal('')` | Angular signal | Holds current search term; tracked by effect() |
| `statusFilter = signal('')` | Angular signal | Holds current status filter; tracked by effect() |
| `debounceTime(300)` on searchControl pipe | RxJS operator | Batches rapid keystrokes into a single emission |
| `distinctUntilChanged()` on searchControl pipe | RxJS operator | Suppresses duplicate consecutive values |
| `this.searchTerm.set(value?.trim() ?? '')` | Signal update | Pushes trimmed search value into the signal |
| `this.statusFilter.set(value ?? '')` | Signal update | Pushes status value into the signal |
| `searchTerm()` and `statusFilter()` in `effect()` | Signal reads | Makes effect() re-run whenever filters change |
| `searchTerm` and `status` params on `loadJobs()` | Function parameters | Passes filter values through to service |
| `debounceTime`, `distinctUntilChanged` imports | RxJS imports | Required for new pipe operators |

---

## 8. What Was Removed

### From `src/app/components/job-table/job-table.component.ts`

| What Removed | Why Removed |
|---|---|
| `let filtered = response.content` | Backend now filters before responding |
| Client-side `jobName.toLowerCase().includes(...)` filter | Replaced by backend `LIKE` query |
| Client-side `job.status === status` filter | Replaced by backend exact-match query |
| `startWith` only import (kept but extended) | `debounceTime` and `distinctUntilChanged` added |

---

## 9. Before vs After Comparison

### Search by Job Name

| | Before | After |
|---|---|---|
| Scope | Only 10 rows on current page | All rows in database |
| Accuracy | Partial (missed other pages) | Full (backend searches entire dataset) |
| `totalElements` | Unchanged when filtering | Updates to reflect filtered count |
| Paginator pages | Always showed unfiltered total | Shows pages for filtered result |
| Performance | Browser JS looping | Database index scan (SQL LIKE) |
| Debounce | None (every keystroke) | 300ms debounce |

### Filter by Status

| | Before | After |
|---|---|---|
| Scope | Only 10 rows on current page | All rows in database |
| Accuracy | Partial | Full |
| `totalElements` | Unchanged | Reflects filtered count |
| URL params | None appended | `&status=COMPLETED` etc. |

### URL Examples

```
# Before (no filter params ever)
GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc

# After — search only
GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll

# After — status only
GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&status=FAILED

# After — both combined
GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll&status=FAILED
```

---

## 10. API Contract

### Request

```
GET /api/jobs
  ?page=<int>         zero-based page index (required, default 0)
  &size=<int>         rows per page: 5 | 10 | 25 | 50 (required, default 10)
  &sortBy=<string>    field: startTime | jobName | status (required, default startTime)
  &sortDir=<string>   asc | desc (required, default desc)
  &jobName=<string>   OPTIONAL — partial job name, case-insensitive
  &status=<string>    OPTIONAL — exact status: RUNNING | COMPLETED | FAILED
```

### Response (HTTP 200)

```json
{
  "content": [
    {
      "id": "abc123",
      "jobName": "Payroll Calculation Job",
      "status": "COMPLETED",
      "startTime": "2026-03-25T10:00:00",
      "endTime": "2026-03-25T10:05:00",
      "message": "Job completed successfully",
      "fileName": null
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "number": 0,
  "size": 10,
  "first": true,
  "last": true,
  "empty": false
}
```

`totalElements: 5` means the backend found 5 records matching the filter — not the
full unfiltered count. The paginator uses this number to calculate how many pages
to display.

---

## 11. Data Flow Diagram

```
User Types "payroll" in Search Box
           │
           ▼
  searchControl.valueChanges
           │
    debounceTime(300ms)           ← waits for pause in typing
           │
    distinctUntilChanged()        ← skips if same as last value
           │
           ▼
  searchTerm.set('payroll')       ← update Angular signal
  currentPage.set(0)              ← reset to first page
           │
           │ Both signals changed → effect() wakes up
           ▼
  effect() reads all 6 signals:
    currentPage()  = 0
    pageSize()     = 10
    sortBy()       = 'startTime'
    sortDir()      = 'desc'
    searchTerm()   = 'payroll'    ← NEW
    statusFilter() = ''
           │
           ▼
  loadJobs(0, 10, 'startTime', 'desc', 'payroll', '')
           │
           ▼
  jobService.getJobs(0, 10, 'startTime', 'desc', 'payroll', '')
           │
    HttpParams built:
    ?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll
           │
           ▼
  GET /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc&jobName=payroll
           │
           ▼
  Backend filters by jobName LIKE '%payroll%'
  Returns Page { content: [...5 matches], totalElements: 5 }
           │
           ▼
  next() callback:
    totalElements.set(5)          ← paginator now shows 5 total
    isEmpty.set(false)
    dataSource.data = content     ← 5 filtered rows rendered in table
    isLoading.set(false)
```

---

## 12. Key Concepts Used

### Angular Signals and `effect()`

Angular signals are reactive state containers. When a signal's value changes, Angular
automatically re-runs any `effect()` (or `computed()`) that read that signal during its
last execution. This is similar to how Vue's `watch` or React's `useEffect` with a
dependency array works, but without needing to manually declare dependencies — Angular
tracks them automatically at runtime.

Before this change, the `effect()` only read 4 signals. Adding `searchTerm()` and
`statusFilter()` reads inside the `effect()` call registers them as tracked dependencies.
From that point, any call to `searchTerm.set(...)` or `statusFilter.set(...)` will
automatically wake up the `effect()` and trigger a new API call.

### `debounceTime(RxJS)`

`debounceTime(ms)` delays an Observable emission by the specified number of milliseconds.
If a new value arrives before the delay expires, the timer resets. It effectively
"waits for the user to stop typing" before emitting.

```
User types: p→a→y→r→o→l→l  (each key ~100ms apart)
Without debounce: 7 emissions → 7 API calls
With debounceTime(300): user finishes typing → 1 emission after 300ms pause → 1 API call
```

### `distinctUntilChanged(RxJS)`

Compares each new emission to the previous one. If they are equal, the emission is
suppressed. Prevents redundant API calls when the value hasn't actually changed, for
example if `startWith('')` and the first typed value pair happen to produce two
identical values.

### `HttpParams` (Angular)

`HttpParams` is Angular's immutable query string builder. Each `.set()` call returns
a **new** `HttpParams` instance — it does not mutate the existing one. This is why we
use `params = params.set(...)` (reassigning the variable) rather than just `params.set(...)`.

```typescript
let params = new HttpParams().set('page', '0').set('size', '10');
// Safe — each set() returns a new instance
params = params.set('jobName', 'payroll');
// params now includes all three
```

---

## 13. Testing This Feature

### Manual testing in the browser

1. Open the dashboard → Network tab in DevTools → filter XHR/Fetch.
2. **Test Search:**
   - Type `"payroll"` in the search box.
   - Observe a 300ms pause then a single `GET /api/jobs?...&jobName=payroll` fires.
   - The table and paginator update to reflect only matching jobs.
   - Clear the search — table reloads with all jobs.
3. **Test Status Filter:**
   - Select `"Failed"` from the dropdown.
   - A `GET /api/jobs?...&status=FAILED` fires immediately.
   - Only failed jobs appear; paginator shows the correct filtered count.
4. **Test Combined:**
   - Type a name AND select a status.
   - URL contains `&jobName=...&status=...` and results reflect both filters.
5. **Test Pagination with Filters Active:**
   - With a filter applied, navigate to next page.
   - Filter params remain in the URL on each page request.
6. **Test Edge Cases:**
   - Type spaces only → no `jobName` param (whitespace trimmed away).
   - Select `"All"` → no `status` param (empty string ignored).
