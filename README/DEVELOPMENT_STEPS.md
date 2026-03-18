# Payroll Job Monitor UI - Manual Development Steps

This document describes the step-by-step process to manually build the **Payroll Job Monitoring Dashboard** application using Angular 21 and Angular Material.

---

## 1) Create the Angular Project

1. Ensure Node.js and npm are installed.
2. Create a new Angular workspace (if not already created):

```bash
ng new payroll-job-monitor-ui --routing --style=scss --standalone
```

3. Change into the project directory:

```bash
cd payroll-job-monitor-ui
```

---

## 2) Install Angular Material

1. Install Material + CDK + Animations:

```bash
ng add @angular/material
```

2. When prompted, accept defaults (or choose a theme like `Indigo/Pink`).

---

## 3) Configure Global Styles

1. Open `src/styles.scss`.
2. Import the Material theme and required fonts:

```scss
@import "@angular/material/prebuilt-themes/indigo-pink.css";
@import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
```

---

## 4) Define the Application Model

1. Create folder: `src/app/models`
2. Create `job.model.ts`:

```ts
export interface Job {
  id: string;
  jobName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  errorMessage?: string;
}
```

---

## 5) Add Mock Job Data

1. Create folder: `src/app/mocks`
2. Create `mock-jobs.ts`:

```ts
import { Job } from '../models/job.model';

export const mockJobs: Job[] = [
  {
    id: '1',
    jobName: 'Payroll Calculation Job',
    status: 'RUNNING',
    startTime: new Date('2026-03-16T10:00:00'),
  },
  { ... }
];
```

---

## 6) Create the Job Service

1. Create folder: `src/app/services`
2. Create `job.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, startWith, switchMap, map } from 'rxjs';
import { Job } from '../models/job.model';
import { mockJobs } from '../mocks/mock-jobs';

@Injectable({ providedIn: 'root' })
export class JobService {
  private jobsSubject = new BehaviorSubject<Job[]>(mockJobs);
  public jobs$ = this.jobsSubject.asObservable();

  constructor() {
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.fetchJobs())
    ).subscribe(jobs => this.jobsSubject.next(jobs));
  }

  getJobs(): Observable<Job[]> {
    return this.jobs$;
  }

  getJobById(id: string): Observable<Job | undefined> {
    return this.jobs$.pipe(
      map(jobs => jobs.find(job => job.id === id))
    );
  }

  private fetchJobs(): Observable<Job[]> {
    return of(mockJobs);
  }
}
```

---

## 7) Setup Routing

1. In `src/app/app.routes.ts`, configure default route:

```ts
import { Routes } from '@angular/router';
import { JobDashboardComponent } from './components/job-dashboard/job-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: JobDashboardComponent }
];
```

2. Ensure `src/app/app.config.ts` includes:

```ts
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
  ]
};
```

---

## 8) Create Standalone Components

Create the following components under `src/app/components/`:

### Job Dashboard
- `job-dashboard.component.ts`
- `job-dashboard.component.html`
- `job-dashboard.component.scss`

This component contains:
- A `mat-toolbar` with the title
- `<app-job-summary>` and `<app-job-table>`

### Job Summary Cards
- `job-summary.component.ts`
- `job-summary.component.html`
- `job-summary.component.scss`

Display counts for:
- Total jobs
- Running jobs
- Completed jobs
- Failed jobs

### Job Table
- `job-table.component.ts`
- `job-table.component.html`
- `job-table.component.scss`

Includes:
- Material table with columns: Job Name, Status, Start, End, Duration, Actions
- Search input (job name)
- Status filter (MatSelect)
- Status chips with color mapping
- Action button opens details dialog

### Job Details Dialog
- `job-details.component.ts`
- `job-details.component.html`
- `job-details.component.scss`

Shows:
- Job Name
- Status (chip)
- Start / end times
- Duration
- Error message (if present)

---

## 9) Ensure Material Modules are Imported in Each Component

Use standalone components and add the needed Material modules to each component's `imports: []` list, e.g.:

```ts
imports: [
  CommonModule,
  MatToolbarModule,
  MatCardModule,
  MatTableModule,
  MatDialogModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatChipsModule,
  ReactiveFormsModule
]
```

---

## 10) Verify Routing Works

1. Ensure `src/app/app.html` contains:

```html
<router-outlet></router-outlet>
```

2. Run dev server and open the app:

```bash
ng serve
```

Visit `http://localhost:4200` and verify the dashboard loads.

---

## 11) Next Enhancements (Optional)

- Replace mock data with real API calls using `HttpClient`.
- Add pagination to the table.
- Add sorting (MatSort).
- Add more job details (logs, steps, etc.).
- Add authentication and role-based access.

---

## Notes

- The project uses Angular 21 with standalone components.
- Material is enabled via `provideAnimations()` and theme import in `styles.scss`.
- Mock data refreshes every 5 seconds to simulate live polling.
