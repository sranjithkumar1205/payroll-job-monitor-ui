# API Deduplication — `getJobs()` Called Once for Both Components

**Date:** March 25, 2026  
**Files Changed:**
- `src/app/services/job.service.ts`
- `src/app/components/job-summary/job-summary.component.ts`

---

## 1. Problem Statement

When the Job Dashboard page loaded, `GET /api/jobs` was firing **multiple times** per
page load — up to **5 independent HTTP requests** from a single user action.

### Root Causes (Two Separate Issues)

#### Issue A — Two components calling `getJobs()` independently

`job-table` and `job-summary` are sibling components rendered side-by-side on the
dashboard. Both had their own `ngOnInit` logic that called `jobService.getJobs()`
directly. Since `JobService` is a singleton but `getJobs()` returns a new cold
`Observable` (HttpClient GET) on every call, each component triggered its own
separate HTTP request.

```
Page loads
  ├── JobTableComponent.ngOnInit()    → GET /api/jobs   (call #1)
  └── JobSummaryComponent.ngOnInit()  → GET /api/jobs   (call #2)
```

#### Issue B — Four `async` pipes subscribing to the same cold Observable

Inside `job-summary`, the four status counts (`totalJobs$`, `runningJobs$`,
`completedJobs$`, `failedJobs$`) were each derived from the same local `jobs$`
variable. However `jobs$` was a **cold Observable** (a plain `getJobs()` result).
Every `async` pipe in the template creates its own subscription to its upstream
Observable. Because the Observable was cold, each subscription triggered a fresh
HTTP call.

```
jobs$ = this.jobService.getJobs()   ← cold observable

Template:
  {{ totalJobs$ | async }}       ← subscription 1 → GET /api/jobs  (call #2)
  {{ runningJobs$ | async }}     ← subscription 2 → GET /api/jobs  (call #3)
  {{ completedJobs$ | async }}   ← subscription 3 → GET /api/jobs  (call #4)
  {{ failedJobs$ | async }}      ← subscription 4 → GET /api/jobs  (call #5)
```

**Total HTTP calls on first page load: up to 5 identical `GET /api/jobs` requests.**

---

## 2. Approaches Considered

### Approach 1 — `shareReplay(1)` only in `job-summary` (Tried, Partially Works)

The first obvious fix for Issue B was to add `shareReplay(1)` to the `jobs$` observable
inside `job-summary`:

```typescript
const jobs$ = this.jobService.getJobs().pipe(
  shareReplay(1)   // ← share one execution among all 4 async pipes
);
```

**What it fixes:** Reduces the 4 subscriptions inside `job-summary` to a single HTTP call.

**What it does NOT fix:** `job-summary` still makes its own HTTP call independently from
`job-table`. So we still get 2 total calls (1 from table + 1 from summary).

**Why this approach was not chosen alone:** It only fixes Issue B, not Issue A.

---

### Approach 2 — Pass data as `@Input()` from a parent component (Considered, Rejected)

An alternative was to move the `getJobs()` call to the parent `job-dashboard` component,
fetch data once there, and pass the result down to both `job-table` and `job-summary`
as inputs.

```
JobDashboardComponent
  ├── fetches jobs once
  ├── <app-job-summary [jobs]="jobs" />
  └── <app-job-table [jobs]="jobs" />
```

**Why this was rejected:**
- `job-table` manages its own pagination, sorting, and filtering state with signals.
  It needs to call `getJobs()` independently whenever those signals change (page change,
  sort change, filter change). Lifting all that state to the parent would cause a large
  and unnecessary refactor.
- `job-summary` only needs aggregate counts; it does not need the full pagination params.
  Coupling it to the table's state would be wrong.

---

### Approach 3 — `BehaviorSubject` shared stream in `JobService` (Chosen, Works Fully)

The cleanest solution without restructuring any component responsibilities:

- Keep `job-table` as the **sole caller** of `getJobs()` — it naturally calls it on every
  meaningful state change (pagination, sort, filter).
- Add a `BehaviorSubject<Page<JobExecution> | null>` to `JobService` as internal state.
- Use `tap()` inside `getJobs()` to push every successful API response into the
  `BehaviorSubject`.
- Expose a public `latestPage$` observable for any component that wants to react to the
  latest data without fetching it themselves.
- In `job-summary`, replace the direct `getJobs()` call with a subscription to
  `latestPage$`, with `shareReplay(1)` to share the single BehaviorSubject emission
  across all 4 derived Observables.

**Result:** Exactly **1 HTTP call** per data load, shared across both components.

---

## 3. Final Solution — Step-by-Step Code Walk-Through

### Step 1 — Add `BehaviorSubject` to `JobService`

**File:** `src/app/services/job.service.ts`

```typescript
import { Observable, BehaviorSubject, of, delay, concat, map, tap } from 'rxjs';
//                    ^^^^^^^^^^^^^^                                   ^^^
//                    newly imported                             newly imported

private readonly _latestPage = new BehaviorSubject<Page<JobExecution> | null>(null);
readonly latestPage$ = this._latestPage.asObservable();
```

**What is a `BehaviorSubject`?**

A `BehaviorSubject` is an RxJS Subject (both an Observable and an Observer) that:
- Holds the **latest value** in memory at all times.
- Immediately emits that latest value to any new subscriber.
- Can be updated imperatively via `.next(value)`.

`_latestPage` is private (only the service can push into it).  
`latestPage$` is public read-only (`asObservable()` hides the `.next()` method from consumers).

Initial value is `null` meaning "no data fetched yet".

---

### Step 2 — Broadcast every response via `tap()` in `getJobs()`

**File:** `src/app/services/job.service.ts`

```typescript
return this.http.get<Page<JobExecution>>(this.apiUrl, { params }).pipe(
  tap(page => this._latestPage.next(page))   // ← newly added
);
```

**What `tap()` does:**

`tap()` is a side-effect RxJS operator. It runs a function for every emission but does
**not** modify the emitted value. Here it does two things at once:
1. Passes the HTTP response straight through to the subscriber (i.e., `job-table`).
2. Simultaneously pushes the same response into `_latestPage` BehaviorSubject so any
   other subscriber (i.e., `job-summary`) is notified automatically.

`job-table` sees the response exactly as before — nothing changes for it.  
`job-summary` now receives the same data without making a separate HTTP call.

---

### Step 3 — Remove direct `getJobs()` call in `job-summary`

**File:** `src/app/components/job-summary/job-summary.component.ts`

**Before:**
```typescript
// ❌ This fired a new HTTP GET /api/jobs independently from job-table
const jobs$ = this.jobService.getJobs();
```

**After:**
```typescript
// ✅ Listens to data that job-table already fetched — no new HTTP call
const jobs$ = this.jobService.latestPage$.pipe(
  filter((page): page is Page<JobExecution> => page !== null),
  shareReplay(1)
);
```

**Why `filter()` here?**  
`latestPage$` starts with `null` (initial BehaviorSubject value). The `filter()` with
the TypeScript type predicate (`page is Page<JobExecution>`) does two things:
1. Skips the initial `null` emission so the summary cards don't display `null`.
2. Narrows the TypeScript type from `Page<JobExecution> | null` to `Page<JobExecution>`,
   so the downstream `map()` calls are type-safe without explicit casts.

**Why `shareReplay(1)` here?**  
This fixes Issue B. Without it, each of the 4 `async` pipes in the template
(`totalJobs$`, `runningJobs$`, `completedJobs$`, `failedJobs$`) would create its own
subscription to `latestPage$`. While `latestPage$` is a hot BehaviorSubject (so no
extra HTTP call), those 4 separate subscriptions would each run the `filter()` and
re-process the value independently.

`shareReplay(1)` converts `jobs$` into a **hot, multicasted** observable with a buffer
of 1. All 4 derived observables share a single upstream subscription and receive the
same emission simultaneously.

---

### Step 4 — Update RxJS imports in `job-summary`

**File:** `src/app/components/job-summary/job-summary.component.ts`

```typescript
// Before
import { Observable, map } from 'rxjs';

// After
import { Observable, map, filter, shareReplay } from 'rxjs';
//                        ^^^^^^  ^^^^^^^^^^^
//                        newly added operators
```

---

## 4. Data Flow After the Fix

```
User opens Dashboard
        │
        ▼
JobTableComponent (constructor effect runs)
        │
        ▼
  loadJobs() called
        │
        ▼
  JobService.getJobs()
        │
        ▼
  HttpClient GET /api/jobs   ← ONLY HTTP CALL
        │
        ├──► tap() ──► _latestPage.next(response)
        │                      │
        │             latestPage$ emits
        │                      │
        │             JobSummaryComponent.ngOnInit()
        │             jobs$ = latestPage$.pipe(filter, shareReplay(1))
        │                      │
        │              ┌───────┴──────────────┐─────────────────────┐
        │              ▼                      ▼                     ▼
        │          totalJobs$         runningJobs$          completedJobs$  failedJobs$
        │          (async pipe)       (async pipe)          (async pipe)    (async pipe)
        │              │                   (all share ONE subscription via shareReplay)
        │
        └──► JobTableComponent receives response directly
             updates dataSource, totalElements, isEmpty, isLoading
```

---

## 5. What Was Newly Added

| What | Where | Why |
|---|---|---|
| `BehaviorSubject<Page<JobExecution> \| null>` named `_latestPage` | `job.service.ts` | Internal mutable state to hold the latest API response |
| `readonly latestPage$` observable | `job.service.ts` | Public read-only stream for any component to subscribe to latest data |
| `tap(page => this._latestPage.next(page))` in `getJobs()` | `job.service.ts` | Side-effect that broadcasts every HTTP response to `latestPage$` |
| `BehaviorSubject`, `tap` added to RxJS imports | `job.service.ts` | Required for new operators |
| `latestPage$.pipe(filter(...), shareReplay(1))` | `job-summary.component.ts` | Replaces direct `getJobs()` call; subscribes to shared stream |
| `filter()` with type predicate | `job-summary.component.ts` | Skips initial `null` and narrows TypeScript type |
| `shareReplay(1)` | `job-summary.component.ts` | Ensures all 4 async pipes share one subscription |
| `filter`, `shareReplay` added to RxJS imports | `job-summary.component.ts` | Required for new operators |

---

## 6. What Was NOT Changed

- `job-table.component.ts` — No changes. It still calls `getJobs()` exactly as before.
  Its pagination, sorting, and filter signals continue to drive API calls.
- `job-table.component.html` — No changes.
- `job-summary.component.html` — No changes. The 4 `async` pipes remain identical.
- `job-summary.component.scss` — No changes.
- Backend API contract — No changes.
- Routing — No changes.

---

## 7. Before vs After Comparison

### HTTP calls on initial page load

| Scenario | Before | After |
|---|---|---|
| `job-table` loads | 1 call | 1 call |
| `job-summary` loads | 1 call (separate) | 0 calls (listens to shared stream) |
| 4 async pipes in `job-summary` | 4 calls (cold observable) | 0 calls (shareReplay) |
| **Total** | **up to 5 calls** | **1 call** |

### HTTP calls on pagination/sort/filter change

| Scenario | Before | After |
|---|---|---|
| User changes page | 1 call from `job-table` | 1 call from `job-table` |
| `job-summary` reacts | No (stale data after first load) | Yes (automatically via `latestPage$`) |

---

## 8. Key RxJS Concepts Used

### `BehaviorSubject`
- Holds the last emitted value in memory.
- Emits immediately to new subscribers with the current cached value.
- Used here as the "message bus" between `job-table` (producer) and `job-summary` (consumer).

### `tap()`
- A pass-through side-effect operator.
- Does not change the Observable's emitted values.
- Used here to push every HTTP response into `_latestPage` without interfering with
  what `job-table` receives.

### `filter()` with type predicate
- Filters out emissions that do not satisfy a condition.
- The type predicate `(page): page is Page<JobExecution>` also narrows the TypeScript
  type, removing `null` from the inferred type after the operator.

### `shareReplay(1)`
- Converts a cold or unicast Observable into a hot, multicasted one.
- Buffers the last 1 emission and replays it to late subscribers.
- Prevents N subscribers from creating N upstream executions.
- Used here to ensure the 4 async pipes in the template share one BehaviorSubject subscription.

---

## 9. Testing This Change

To verify that only 1 HTTP call is made:

1. Open browser DevTools → Network tab → filter by `XHR / Fetch`.
2. Navigate to the Dashboard page.
3. Confirm only **one** `GET /api/jobs` request appears on page load.
4. Change page or apply a filter → confirm again only **one** new `GET /api/jobs` request fires.
5. Confirm the summary cards (Total, Running, Completed, Failed) still update correctly
   after any table action.
