# Pagination Implementation — Developer Documentation

> **Scope:** Server-side pagination, sorting, and client-side filtering in the Payroll Job Monitor UI.  
> **Last updated:** 2026-03-23

---

## Table of Contents

1. [Overview](#1-overview)  
2. [Architecture Diagram](#2-architecture-diagram)  
3. [Files Changed](#3-files-changed)  
4. [Data Flow](#4-data-flow)  
5. [Page\<T\> Model](#5-paget-model)  
6. [Constants & Configuration](#6-constants--configuration)  
7. [JobService — getJobs()](#7-jobservice--getjobs)  
8. [JobTableComponent](#8-jobtablecomponent)  
   - 8.1 Signals  
   - 8.2 Reactive Effect  
   - 8.3 Filter Reset Logic  
   - 8.4 loadJobs()  
   - 8.5 onPageChange()  
   - 8.6 Sort Handlers  
9. [HTML Template — MatPaginator](#9-html-template--matpaginator)  
10. [JobSummaryComponent](#10-jobsummarycomponent)  
11. [TypeScript Strict-Type Fix](#11-typescript-strict-type-fix)  
12. [Backend Contract](#12-backend-contract)  
13. [Extending / Changing Behaviour](#13-extending--changing-behaviour)  

---

## 1. Overview

The job table previously loaded all job records in a single HTTP request and
relied on `MatTableDataSource`'s built-in client-side pagination.  
This approach becomes impractical as row counts grow.

**The new implementation delegates pagination and sorting to the Spring Boot
backend** while retaining lightweight client-side text/status filtering on the
current page's data.

Key properties of the implementation:

| Property | Value |
|----------|-------|
| Pagination strategy | Server-side (Spring `Page<T>`) |
| Filter strategy | Client-side (substring + exact match) |
| State management | Angular Signals |
| Default page size | 10 rows |
| Page size options | 5, 10, 25, 50 |
| Default sort field | `startTime` descending |

---

## 2. Architecture Diagram

```
User interaction
      │
      ▼
┌─────────────────────────────────────┐
│         JobTableComponent           │
│                                     │
│  Signals: currentPage, pageSize,    │
│           sortBy, sortDir           │
│       │                             │
│   effect() ─────────────────────────┼──► loadJobs(page, size, sortBy, sortDir)
│                                     │              │
│  Filter controls (reactive forms):  │              ▼
│    searchControl ─► reset page 0    │    JobService.getJobs()
│    statusControl ─► reset page 0    │              │
│                                     │    HttpClient GET /api/jobs
│  MatPaginator (page) event          │    ?page=0&size=10&sortBy=startTime&sortDir=desc
│    └─► onPageChange(event)          │              │
│         ├─► currentPage.set()       │              ▼
│         └─► pageSize.set()          │    Backend returns Page<JobExecution>
│                                     │              │
│  Sort menu / sort dropdown          │    .content[]  ← displayed rows
│    └─► onSortChange / onSortField   │    .totalElements ← paginator length
│                                     │
└─────────────────────────────────────┘
                    │
                    ▼
         MatPaginator + MatTable
         display `dataSource` rows
```

---

## 3. Files Changed

| File | Change type | Purpose |
|------|-------------|---------|
| `src/app/models/page.model.ts` | **New** | `Page<T>` TypeScript interface |
| `src/app/models/constants.ts` | **Updated** | Added `DEFAULT_PAGE_SIZE`, `PAGE_SIZE_OPTIONS` |
| `src/app/services/job.service.ts` | **Updated** | `getJobs()` accepts pagination params, builds `HttpParams` |
| `src/app/components/job-table/job-table.component.ts` | **Updated** | Signals, effect, filter reset, `loadJobs()`, event handlers |
| `src/app/components/job-table/job-table.component.html` | **Updated** | `mat-paginator` binding, sort controls |
| `src/app/components/job-summary/job-summary.component.ts` | **Updated** | Consumes `Page<JobExecution>` instead of raw array |

---

## 4. Data Flow

```
1. Component initialises
       │
       ▼
2. effect() runs immediately (Angular signals)
       │
       ▼
3. loadJobs(page=0, size=10, sortBy='startTime', sortDir='desc')
       │
       ▼
4. JobService.getJobs() → HttpClient GET /api/jobs?page=0&size=10&...
       │
       ▼
5. Backend returns Page<JobExecution> JSON
       │
       ├── response.totalElements ──► totalElements.set()  ──► MatPaginator.length
       ├── response.empty         ──► isEmpty.set()         ──► empty-state toggle
       └── response.content[]     ──► client-side filters  ──► dataSource.data
                                            │
                                     searchControl (text)
                                     statusControl (exact)
                                            │
                                            ▼
                                   Filtered rows in MatTable

6. User clicks next page
       │
       ▼
7. MatPaginator emits PageEvent → onPageChange()
       │
       ├── currentPage.set(event.pageIndex)
       └── pageSize.set(event.pageSize)
              │
              ▼
       effect() re-runs → back to step 3
```

---

## 5. Page\<T\> Model

**File:** `src/app/models/page.model.ts`

```typescript
export interface Page<T> {
  content: T[];          // Rows for the current page
  totalElements: number; // Total rows across ALL pages
  totalPages: number;    // ceil(totalElements / size)
  number: number;        // Current page index (zero-based)
  size: number;          // Requested page size
  first: boolean;        // true when number === 0
  last: boolean;         // true when number === totalPages - 1
  empty: boolean;        // true when content.length === 0
}
```

This interface mirrors the JSON shape that Spring Data's `Page<T>` serialises
to by default when using `PagingAndSortingRepository` or `JpaRepository`.

---

## 6. Constants & Configuration

**File:** `src/app/models/constants.ts`

```typescript
export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 10,           // initial page size on first load
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50], // MatPaginator dropdown choices

  JOB_STATUS_OPTIONS: [...],       // status filter dropdown options
  STATUS_COLOR_MAP: { ... },       // Material theme palette tokens

  DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'
} as const;
```

**Why a single constants file?**  
All components that render pagination (table, paginator, summary cards) import
values from `APP_CONSTANTS`.  Changing `DEFAULT_PAGE_SIZE` in one place updates
the initial HTTP request, the mat-paginator default, and the summary query
simultaneously.

---

## 7. JobService — getJobs()

**File:** `src/app/services/job.service.ts`

```typescript
getJobs(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'startTime',
  sortDir: 'asc' | 'desc' = 'desc'
): Observable<Page<JobExecution>>
```

**HttpParams built:**

```
GET http://localhost:8080/api/jobs
      ?page=0
      &size=10
      &sortBy=startTime
      &sortDir=desc
```

`HttpParams` is **immutable** — each `.set()` call returns a new instance.
This prevents accidental parameter mutation across requests.

Angular's `HttpClient.get<T>()` transparently deserialises the JSON response
body into the typed `Page<JobExecution>` shape at runtime.

---

## 8. JobTableComponent

**File:** `src/app/components/job-table/job-table.component.ts`

### 8.1 Signals

```typescript
currentPage  = signal(0);                    // zero-based page index
pageSize     = signal<number>(defaultPageSize); // rows per page — explicitly typed number
totalElements = signal(0);                   // total records (drives mat-paginator length)
sortBy       = signal('startTime');          // backend sort field
sortDir      = signal<'asc' | 'desc'>('desc'); // backend sort direction

isLoading    = signal(false); // shows spinner
isEmpty      = signal(false); // shows empty-state message
```

> **Why `signal<number>` instead of `signal(10)`?**  
> TypeScript infers `signal(10)` as `Signal<10>` (a literal type).  
> When `MatPaginator` assigns a different page size (e.g. `25`) at runtime a
> `TS2345` type error fires.  Explicitly annotating `signal<number>` widens the
> type to `Signal<number>`, accepting any numeric value.  
> *(See [TypeScript Strict-Type Fix](#11-typescript-strict-type-fix).)*

### 8.2 Reactive Effect

```typescript
constructor() {
  effect(() => {
    this.loadJobs(
      this.currentPage(),
      this.pageSize(),
      this.sortBy(),
      this.sortDir()
    );
  });
}
```

`effect()` runs once on component construction and then **re-runs automatically
whenever any signal read inside it changes its value**.  This replaces the need
for manual `BehaviorSubject` + `combineLatest` patterns.

When a user:
- clicks a paginator button → `currentPage` changes → effect re-runs
- changes page size → `pageSize` changes → effect re-runs
- changes sort field/direction → `sortBy`/`sortDir` change → effect re-runs

### 8.3 Filter Reset Logic

```typescript
ngOnInit() {
  this.searchControl.valueChanges.pipe(startWith('')).subscribe(() => {
    this.currentPage.set(0); // changing the filter → jump to page 1
  });

  this.statusControl.valueChanges.pipe(startWith('')).subscribe(() => {
    this.currentPage.set(0);
  });
}
```

`startWith('')` fires the subscription immediately on init so the initial
empty-string value is processed identically to a user clearing the search box.

Resetting `currentPage` to `0` is sufficient because `effect()` watches that
signal and automatically calls `loadJobs()`.

### 8.4 loadJobs()

```
loadJobs flow:
  isLoading.set(true)
       │
       ▼
  jobService.getJobs(page, size, sortBy, sortDir)
       │
  ┌────┴─────────────────────┐
  │ success                  │ error
  ▼                          ▼
totalElements.set()      isLoading.set(false)
isEmpty.set()            isEmpty.set(true)
client-side filter
  └─ text search (substring)
  └─ status filter (exact)
dataSource.data = filtered
isLoading.set(false)
```

**Client-side filters** are applied _after_ the server response because:
- The search query is a free-text substring that may be expensive to push to SQL LIKE.
- Status filtering on a small in-memory array is instantaneous.
- Both filters immediately reset `currentPage` to 0 (see 8.3) so no stale data leaks.

### 8.5 onPageChange()

```typescript
onPageChange(event: PageEvent): void {
  this.currentPage.set(event.pageIndex); // zero-based
  this.pageSize.set(event.pageSize);
}
```

`MatPaginator` emits a `PageEvent` for every user navigation action (next, prev,
first, last, page-size change).  Setting the signals triggers `effect()`.

### 8.6 Sort Handlers

| Method | Signal(s) reset | Signals set |
|--------|-----------------|-------------|
| `onSortChange(direction)` | `currentPage → 0` | `sortDir` |
| `onSortFieldChange(field)` | `currentPage → 0` | `sortBy` |

Both methods reset `currentPage` to `0` first so the user sees the beginning of
the newly sorted result set.

---

## 9. HTML Template — MatPaginator

**File:** `src/app/components/job-table/job-table.component.html`

```html
<mat-paginator
  [length]="totalElements()"          <!-- total record count from backend -->
  [pageSize]="pageSize()"             <!-- current rows-per-page (signal) -->
  [pageSizeOptions]="pageSizeOptions" <!-- [5, 10, 25, 50] from APP_CONSTANTS -->
  [pageIndex]="currentPage()"         <!-- current zero-based page (signal) -->
  (page)="onPageChange($event)"       <!-- PageEvent handler -->
  showFirstLastButtons>               <!-- |< first  last >| buttons -->
</mat-paginator>
```

**Binding direction:**

```
Signal ──► [binding] ──► MatPaginator  (component controls paginator state)
MatPaginator ──► (page) ──► onPageChange() ──► signals  (user drives it back)
```

This keeps the paginator and component state in sync without needing a
`@ViewChild` reference.

---

## 10. JobSummaryComponent

**File:** `src/app/components/job-summary/job-summary.component.ts`

The summary cards show aggregate counts fetched from `getJobs()` (first page):

```typescript
const jobs$ = this.jobService.getJobs(); // default: page 0, size 10

this.totalJobs$     = jobs$.pipe(map(page => page.totalElements));  // full DB count
this.runningJobs$   = jobs$.pipe(map(page => page.content.filter(j => j.status === 'RUNNING').length));
this.completedJobs$ = jobs$.pipe(map(page => page.content.filter(j => j.status === 'COMPLETED').length));
this.failedJobs$    = jobs$.pipe(map(page => page.content.filter(j => j.status === 'FAILED').length));
```

**Caveat:** `totalJobs$` uses `page.totalElements` (full count) while the
status counts use `page.content` (first page only).  If the backend returns more
jobs than fit on a single page, status counts will under-report.  
**Recommended improvement:** Add a dedicated `GET /api/jobs/summary` endpoint
that returns pre-aggregated counts.

---

## 11. TypeScript Strict-Type Fix

**Symptom:** TS2345 error — _"Argument of type 'number' is not assignable to parameter of type '10'"_

**Root cause:**

```typescript
// Bad — TypeScript infers Signal<10> (literal type)
pageSize = signal(this.defaultPageSize); // defaultPageSize = 10

// MatPaginator later assigns 25 → type error
```

**Fix:**

```typescript
// Good — explicitly widen to Signal<number>
pageSize = signal<number>(this.defaultPageSize);
```

This preserves the default value of `10` while accepting any number that
`MatPaginator` may assign when the user changes the page-size selector.

---

## 12. Backend Contract

The Angular frontend expects the following from the Spring Boot backend:

### Request

```
GET /api/jobs
    ?page=<int>          // zero-based page index
    &size=<int>          // rows per page (5 | 10 | 25 | 50)
    &sortBy=<string>     // field name: startTime | jobName | status
    &sortDir=<asc|desc>  // sort direction
```

### Response (HTTP 200)

```json
{
  "content": [
    {
      "id": "...",
      "jobName": "Payroll Job",
      "status": "COMPLETED",
      "startTime": "2026-03-23T10:00:00",
      "endTime": "2026-03-23T10:05:00",
      "message": "Job completed successfully",
      "fileName": null
    }
  ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "first": true,
  "last": false,
  "empty": false
}
```

This matches Spring Data's default `Page<T>` serialisation produced by
`JpaRepository.findAll(Pageable pageable)`.

---

## 13. Extending / Changing Behaviour

### Change default page size

Edit `src/app/models/constants.ts`:

```typescript
DEFAULT_PAGE_SIZE: 25,           // was 10
PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
```

Because `JobTableComponent` reads `APP_CONSTANTS.DEFAULT_PAGE_SIZE`, the change
propagates automatically to the signal initial value, the HTTP request, and the
MatPaginator default.

### Add a new sort field

1. Add a `<mat-option>` in `job-table.component.html`:

   ```html
   <mat-option value="endTime">End Time</mat-option>
   ```

2. Ensure the backend's `JobExecution` entity has a field named `endTime` that Spring
   Data can sort on.

### Push text search to the backend

Replace the client-side filter in `loadJobs()`:

```typescript
// Current (client-side)
filtered = filtered.filter(job =>
  job.jobName.toLowerCase().includes(search.toLowerCase())
);

// Future (server-side) — add search param to getJobs() signature
this.jobService.getJobs(page, size, sortBy, sortDir, search)
```

Add a corresponding `search` query param to `JobService.getJobs()` and update
the backend controller to accept and apply it.

### Add a dedicated summary endpoint

Replace the first-page fetch in `JobSummaryComponent` with a single request:

```typescript
// New backend endpoint: GET /api/jobs/summary
// Returns: { total, running, completed, failed }
this.jobService.getJobSummary().subscribe(summary => { ... });
```

This eliminates the under-counting issue described in [Section 10](#10-jobsummarycomponent).
