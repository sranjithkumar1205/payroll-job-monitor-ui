# Draw.io Diagrams Update Guide - With JobTriggerComponent and AppShellComponent

## How to Update Draw.io Files Manually

Since draw.io XML files are complex, you can manually update them directly in draw.io online editor. Follow these steps:

### 1. Architecture Diagram Update (architecture-diagram.drawio)

**New Components to Add:**
- **AppShellComponent** (Root container with Sidenav + Toolbar)
- **JobTriggerComponent** (Job execution form with file upload)
- **Constants & Enums Layer** (JobStatus, JobExecutionStatus, APP_CONSTANTS)

**Steps:**
1. Open: https://app.diagrams.net/
2. File → Open Recent → architecture-diagram.drawio (from your workspace)
3. Add these elements:

```
AT TOP LEVEL (outer container):
├─ AppShellComponent (magenta box)
│   ├─ MatSidenav (responsive sidebar)
│   ├─ MatToolbar (with PageTitle signal)
│   └─ router-outlet (inner content)
│
AT MAIN LAYER:
├─ JobTriggerComponent (cyan box) - NEW JOB EXECUTION FORM
│   ├─ JobForm (FormGroup with file upload input)
│   ├─ Signals: jobTemplates, lastExecution, executionHistory
│   └─ runJob() → JobService.triggerJob()
│
├─ JobDashboardComponent (existing - keep as is)
│   ├─ JobSummaryComponent (stats cards)
│   └─ JobTableComponent (with MatPaginator pagination)
│
AT SERVICE LAYER:
├─ JobService (existing)
│   ├─ getJobs(): Observable<Job[]>
│   ├─ triggerJob(job): Observable<JobExecution>
│   └─ jobsSubject: BehaviorSubject<Job[]>
│
├─ Constants & Models Layer - NEW
│   ├─ JobStatus enum: RUNNING, COMPLETED, FAILED
│   ├─ JobExecutionStatus enum: STARTING, RUNNING, COMPLETED, FAILED
│   └─ APP_CONSTANTS: page sizes, colors, status options
│
AT DATA LAYER (existing):
├─ Mock Jobs Data
│   └─ Job[] with execution history
├─ Future API Gateway (dashed)
│
AT EXTERNAL:
├─ Payroll Processing System (dashed)
└─ Database (dashed)
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ AppShellComponent (MAGENTA - Root Navigation)               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │MatSidenav(responsive)  │ MatToolbar (Page Title)         ││
│ │                        │ ┌──────────────────────────────┐││
│ │  • Dashboard      ─────→ │ router-outlet                │││
│ │  • Job Execution  │     │ ┌──────────────────────────┐ │││
│ │  • Settings       │     │ │JobTriggerComponent(CYAN) │ │││
│ │                   │     │ │ • Form Inputs            │ │││
│ │  (BreakpointObv)  │     │ │ • File Upload            │ │││
│ └──────────────────────────┤ │ • runJob()               │ │││
│ │                          │ │   ↓ to JobService      │ │││
│ │                          │ └──────────────────────────┘ │││
│ │ Job Dashboard           │                               │││
│ │ ┌──────────────────────┤                               │││
│ │ │JobSummaryComponent   │                               │││
│ │ │                      │                               │││
│ │ │JobTableComponent     │ JobResultComponent           │││
│ │ │(with MatPaginator)   │ (Status display)             │││
│ │ │- Page sizes: 5,10,25,50                             │││
│ │ │- Filter by status                                   │││
│ └──────────────────────┴────────────────────────────────┘││
└─────────────────────────────────────────────────────────────┘
                              ↓
                    JobService (CYAN)
                    • getJobs()
                    • triggerJob(job)
                    • jobsSubject: BehaviorSubject
                              ↓
        ┌─────────────────────┬────────────────────────┐
        ↓                     ↓                        ↓
   Mock Jobs Data   Constants & Enums Layer    Future API
   (YELLOW)        (ORANGE - NEW)               (MAGENTA dashed)
   ┌──────────┐   ┌──────────────────────┐    ┌────────────┐
   │ Job[]    │   │JobStatus enum        │    │ API Gateway│
   │ []Job    │   │JobExecutionStatus    │    │ (dashed)   │
   │Execution │   │APP_CONSTANTS         │    └────────────┘
   │[]        │   └──────────────────────┘           ↓
   └──────────┘                              ┌────────────────┐
                                             │Payroll System  │
                                             │ → Database     │
                                             └────────────────┘

LEGEND:
━━━━ Solid Line: Current Implementation
- - - Dashed Line: Future Implementation
MAGENTA: Navigation/Root Components
CYAN: Services & UI Components
YELLOW: Data Layer
ORANGE: Constants & Models
```

---

### 2. Component Class Diagram Update (component-class-diagram.drawio)

**Add These Classes (showing method signatures):**

```
┌─────────────────────────────────────────────────────────────┐
│ AppShellComponent                                           │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│  - sidenavOpen: signal<boolean>                            │
│  - isMobile: signal<boolean>                               │
│  - pageTitle: signal<string>                               │
│  - breakpointObserver: BreakpointObserver                  │
│  - router: Router                                          │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                    │
│  + ngOnInit(): void                                        │
│  + toggleSidenav(): void                                   │
│  - updatePageTitle(route: string): void                    │
│  - detectMobileView(): void                                │
├─────────────────────────────────────────────────────────────┤
│ Signals Used:                                              │
│  + @signal pageTitle                                       │
│  + @signal sidenavOpen                                     │
│  + @signal isMobile (BreakpointObserver)                  │
└─────────────────────────────────────────────────────────────┘
            ↑
            │implements OnInit
            │
            └──→ MatSidenavModule
                 MatToolbarModule
                 MatIconModule
                 MatButtonModule
```

```
┌─────────────────────────────────────────────────────────────┐
│ JobTriggerComponent                                         │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│  - jobForm: FormGroup                                      │
│  - jobTemplates: signal<JobTemplate[]>                     │
│  - selectedFileName: signal<string>                        │
│  - isExecuting: signal<boolean>                            │
│  - lastExecution: signal<JobExecution | null>              │
│  - executionHistory: signal<JobExecution[]>                │
│  - jobService: JobService (inject)                         │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                    │
│  + ngOnInit(): void                                        │
│  + runJob(): void → uses JobExecutionStatus enum           │
│  + onFileSelected(event): void                             │
│  + clearHistory(): void                                    │
│  + isPastExecution(): boolean uses enum comparison         │
├─────────────────────────────────────────────────────────────┤
│ Form Controls:                                              │
│  - jobTemplate (required, Validators)                      │
│  - fileUpload (optional)                                   │
│  - executionNote (optional)                                │
└─────────────────────────────────────────────────────────────┘
            ↑
            │implements OnInit, OnDestroy
            │
            └──→ ReactiveFormsModule
                 MatFormFieldModule
                 MatSelectModule
                 MatButtonModule
                 MatFileUploadModule
```

```
┌─────────────────────────────────────────────────────────────┐
│ JobTableComponent                                           │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│  - displayedColumns: string[]                              │
│  - @ViewChild(MatPaginator) paginator: MatPaginator        │
│  - dataSource: MatTableDataSource<Job>                     │
│  - jobs: signal<Job[]>                                     │
│  - selectedStatus: signal<JobStatus>                       │
│  - PAGE_SIZE_OPTIONS: [5, 10, 25, 50] (from APP_CONSTANTS)│
│  - DEFAULT_PAGE_SIZE: 10 (from APP_CONSTANTS)             │
│  - STATUS_COLOR_MAP (from APP_CONSTANTS)                   │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                    │
│  + ngAfterViewInit(): void                                 │
│  + onStatusFilterChange(status: JobStatus): void           │
│  + getStatusColor(status: JobStatus): string               │
│  + onTableRowClick(job: Job): void                         │
│  - applyFilters(): void                                    │
├─────────────────────────────────────────────────────────────┤
│ Reactive Features:                                          │
│  - searchControl: FormControl                              │
│  - statusControl: FormControl (with JOB_STATUS_OPTIONS)   │
│  - RxJS operators: map, filter, combineLatest, pipe        │
└─────────────────────────────────────────────────────────────┘
            ↑
            │implements AfterViewInit
            │
            └──→ MatTableModule
                 MatPaginatorModule
                 MatSortModule
                 MatFormFieldModule
                 MatSelectModule
```

```
┌─────────────────────────────────────────────────────────────┐
│ JobService                                                  │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│  - private jobsSubject: BehaviorSubject<Job[]>             │
│  - public jobs$: Observable<Job[]>                         │
│  - private pollInterval: number = 5000ms                   │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                    │
│  + getJobs(): Observable<Job[]>                            │
│  + triggerJob(jobId: string): Observable<JobExecution>     │
│  + getJobDetails(id: string): Observable<Job>              │
│  - startPolling(): void uses RxJS interval()               │
│  - refreshJobs(): void                                     │
├─────────────────────────────────────────────────────────────┤
│ Data Providers:                                             │
│  - Mock: mockJobs service injection                         │
│  - Future: API Gateway integration (dashed)                │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ Enums & Constants (Models Layer)                           │
├─────────────────────────────────────────────────────────────┤
│ JobStatus enum:                                             │
│  - RUNNING = 'RUNNING'                                     │
│  - COMPLETED = 'COMPLETED'                                 │
│  - FAILED = 'FAILED'                                       │
├─────────────────────────────────────────────────────────────┤
│ JobExecutionStatus enum:                                    │
│  - STARTING = 'STARTING'                                   │
│  - RUNNING = 'RUNNING'                                     │
│  - COMPLETED = 'COMPLETED'                                 │
│  - FAILED = 'FAILED'                                       │
├─────────────────────────────────────────────────────────────┤
│ APP_CONSTANTS object:                                       │
│  - DEFAULT_PAGE_SIZE: 10                                   │
│  - PAGE_SIZE_OPTIONS: [5, 10, 25, 50]                     │
│  - JOB_STATUS_OPTIONS: [{value, label, color}]             │
│  - STATUS_COLOR_MAP: {status → color}                      │
│  - DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'               │
│  - EMPTY_STATE_MESSAGE: strings for UI                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Data Flow Diagram Update (data-flow-diagram.drawio)

**Add These Flows:**

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 1: Application Initialization                         │
├─────────────────────────────────────────────────────────────┤
  1. Browser Loads (main.ts)
          ↓
  2. bootstrapApplication(AppComponent)
          ↓
  3. AppShellComponent.ngOnInit()
          ↓
  4. Router.events subscription starts
          ↓
  5. BreakpointObserver detects device (mobile/desktop)
          ↓
  6. sidenavOpen signal = false (mobile) or true (desktop)
          ↓
  7. pageTitle signal = APP_CONSTANTS.DEFAULT_PAGE_TITLE
          ↓
  8. Application renders with Sidenav + Toolbar + router-outlet
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 2: Job Execution (JobTriggerComponent)                │
├─────────────────────────────────────────────────────────────┤
  1. User navigates to '/trigger' route
          ↓
  2. AppShellComponent detects NavigationEnd event
          ↓
  3. pageTitle.set('Job Execution Form')
          ↓
  4. JobTriggerComponent renders
          ↓
  5. User fills form:
       - Selects jobTemplate from dropdown
       - (Optional) Uploads CSV file
       - Clicks "Run Job" button
          ↓
  6. runJob() method called
          ↓
  7. FormValidation check (FormBuilder validators)
          ↓
  8. Create JobExecution object
       status = JobExecutionStatus.STARTING (enum)
          ↓
  9. Call JobService.triggerJob(execution)
          ↓
  10. JobService adds to jobsSubject BehaviorSubject
          ↓
  11. Poll every 5000ms (RxJS interval + switchMap)
          ↓
  12. Update execution status:
        STARTING → RUNNING → (COMPLETED or FAILED)
          ↓
  13. lastExecution signal updated
          ↓
  14. executionHistory signal updated
          ↓
  15. JobResultComponent displays result with color:
        • COMPLETED = green (#4caf50)
        • RUNNING = orange (#ff9800)
        • FAILED = red (#f44336)
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 3: Job List & Pagination (JobTableComponent)         │
├─────────────────────────────────────────────────────────────┤
  1. User navigates to '/dashboard' route
          ↓
  2. pageTitle.set('Dashboard')
          ↓
  3. JobDashboardComponent initializes
          ↓
  4. JobSummaryComponent displays stats:
       - Total jobs
       - Running count (JobStatus filter)
       - Completed count
       - Failed count
          ↓
  5. JobTableComponent ngAfterViewInit()
          ↓
  6. MatPaginator connected
       - Page sizes: [5, 10, 25, 50] from APP_CONSTANTS
       - Default: 10 items per page
          ↓
  7. JobService.getJobs() called (Observable)
          ↓
  8. Mock data loaded into MatTableDataSource
          ↓
  9. Paginator emitted: pageChange event
          ↓
  10. Search control (FormControl) combined with status filter
          ↓
  11. RxJS operators applied: map, filter, combineLatest, pipe
          ↓
  12. dataSource.filter = combined filter value
          ↓
  13. MatTable re-renders current page (5-50 items)
          ↓
  14. Status cells colored using APP_CONSTANTS.STATUS_COLOR_MAP
          ↓
  15. User clicks row → JobDetailsComponent (MatDialog)
          ↓
  16. Dialog shows full job details with execution history
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 4: Sidenav Navigation (AppShellComponent)            │
├─────────────────────────────────────────────────────────────┤
  1. User clicks hamburger menu or sidenav item
          ↓
  2. toggleSidenav() called
          ↓
  3. sidenavOpen.set(!sidenavOpen())
          ↓
  4. MatSidenav template reactive to signal:
       [opened]="sidenavOpen()"
          ↓
  5. Sidenav slides in/out (animation)
          ↓
  6. User clicks navigation link (e.g., "Job Execution")
          ↓
  7. Router.navigate(['/trigger'])
          ↓
  8. Router emits NavigationEnd event
          ↓
  9. AppShellComponent subscription triggers
          ↓
  10. pageTitle updated based on URL
          ↓
  11. Corresponding component (JobTrigger/Dashboard) loads
       in router-outlet
          ↓
  12. sidenavOpen = false if mobile (responsive)
          ↓
  13. UI updates with new title and component
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 5: Constants & Enums Usage Pattern                   │
├─────────────────────────────────────────────────────────────┤
  1. Component imports APP_CONSTANTS and enums:
       import { APP_CONSTANTS, JobStatus, JobExecutionStatus }
          ↓
  2. Type-safe status comparisons anywhere in code:
       if (job.status === JobStatus.COMPLETED) {...}
          ↓
  3. Centralized color mapping:
       color = APP_CONSTANTS.STATUS_COLOR_MAP[status]
          ↓
  4. Pagination configuration reused:
       pageSizeOptions = APP_CONSTANTS.PAGE_SIZE_OPTIONS
          ↓
  5. Filter options from constants:
       statusOptions = APP_CONSTANTS.JOB_STATUS_OPTIONS
          ↓
  6. Single source of truth benefits:
       - Change once, apply everywhere
       - IDE autocompletion for enum values
       - No string typos possible
       - Compile-time type checking
└─────────────────────────────────────────────────────────────┘
```

---

## Manual Steps to Update draw.io Files:

### For Each Diagram:
1. **Online Editor:** https://app.diagrams.net/
2. **File → Open → From Device** → Select `architecture-diagram.drawio`
3. **Add Elements:**
   - Use Insert menu to add rectangles/boxes
   - Use Insert → Shape for specialized shapes
   - Right-click → Edit Style for formatting
4. **Connect:** Use Connector tool (line icon) to connect components
5. **Color Code:**
   - Magenta (#ff00ff): Navigation/Root components
   - Cyan (#00ffff): Services & UI components  
   - Yellow (#ffff00): Data
   - Orange (#ff6600): Constants/Models
   - Red (dashed): Future implementations
6. **Save:** File → Save (auto-saves back to workspace)

### Quick Reference: Component Colors
```
AppShellComponent → Magenta (#ff00ff)
JobTriggerComponent → Cyan (#00ffff)
JobTableComponent → Cyan (#00ffff)
JobService → Cyan (#00ffff)
Constants/Enums Layer → Orange (#ff6600)
Mock Data → Yellow (#ffff00)
Future API → Magenta dashed (#ff00ff)
```

---

## File Locations:
- `/draw.io/architecture-diagram.drawio` - Update with Sidenav & Job Trigger
- `/draw.io/component-class-diagram.drawio` - Update with new class signatures
- `/draw.io/data-flow-diagram.drawio` - Update with all 5 flows

---

## Summary of Changes:
✅ AppShellComponent shown as root container with Sidenav  
✅ JobTriggerComponent explicitly shown with form and file upload  
✅ Constants & Enums Layer added  
✅ Pagination flow included in JobTable  
✅ All recent code changes reflected  
✅ Router navigation flow documented  
✅ Type-safe enum usage demonstrated
