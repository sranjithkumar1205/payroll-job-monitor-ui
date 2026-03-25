# Draw.io Diagrams Update Guide

**Note**: The draw.io XML files require precise editing. Below is a comprehensive guide for updating each diagram to reflect all current changes and implementations.

## Updated Diagrams - Recommended Changes

### 1. **ARCHITECTURE DIAGRAM** (architecture-diagram.drawio)

#### Add These New Components to Presentation Layer:
- **AppShellComponent** (Sidenav with responsive navigation)
- **JobTriggerComponent** (Job Execution Form - NEW)
- **JobResultComponent** (Execution Result Display - NEW)
- **JobHistoryComponent** (Job Execution History - NEW)
- Update **JobTableComponent** label to include "(with Pagination)"

#### Add New Models & Constants Layer:
- **constants.ts**
  - JobStatus enum (RUNNING, COMPLETED, FAILED)
  - JobExecutionStatus enum (STARTING, RUNNING, COMPLETED, FAILED)
  - APP_CONSTANTS object (pagination sizes, status options, color maps)
- **job.model.ts**
  - Job Interface
  - JobExecution Interface (NEW)
  - JobTemplate Interface
- **material.providers.ts**
  - MatSidenavModule, MatToolbarModule
  - MatTableModule, MatPaginatorModule (NEW)
  - MatFormFieldModule, etc.

#### Update Service Layer:
- **JobService** methods:
  - getJobs(): Observable<Job[]>
  - getJobById(id: string): Observable<Job | undefined>
  - triggerJob(jobName, file): Observable<JobExecution>
  - getJobTemplates(): Observable<JobTemplate[]>
  - Real-time updates via RxJS interval (5s polling)

#### Data & State Management Layer:
- RxJS BehaviorSubject for state management
- Observable streams for reactive updates
- Mock data (mock-jobs.ts)
- Future API integration placeholder

#### Key Features to Highlight:
- ✓ Pagination (5, 10, 25, 50 items per page)
- ✓ Type-safe status management with Enums
- ✓ Centralized constants (APP_CONSTANTS)
- ✓ New job execution workflow
- ✓ Responsive Material Design

---

### 2. **COMPONENT CLASS DIAGRAM** (component-class-diagram.drawio)

#### Component Classes to Add/Update:

**AppShellComponent (NEW)**
```
Properties:
+ sidenav: MatSidenav
+ isMobile: signal<boolean>
+ sidenavOpen: signal<boolean>
+ pageTitle: signal<string>

Methods:
+ ngOnInit(): void
+ ngAfterViewInit(): void
+ navigateTo(route: string): void
+ toggleSidenav(): void
```

**JobTableComponent (UPDATED)**
```
Properties:
+ displayedColumns: string[]
+ dataSource: MatTableDataSource<Job>
+ @ViewChild paginator: MatPaginator
+ pageSizeOptions: number[] (from APP_CONSTANTS)
+ defaultPageSize: number (from APP_CONSTANTS)
+ statusOptions: Array (from APP_CONSTANTS)

Methods:
+ ngOnInit(): void
+ ngAfterViewInit(): void
+ getStatusColor(status: JobStatus): string
+ formatDuration(duration?: number): string
+ openDetails(job: Job): void
```

**JobTriggerComponent (NEW)**
```
Properties:
+ form: FormGroup
+ jobTemplates: signal<JobTemplate[]>
+ selectedFileName: signal<string | null>
+ isExecuting: signal<boolean>
+ lastExecution: signal<JobExecution | null>
+ executionHistory: signal<JobExecution[]>

Methods:
+ ngOnInit(): void
+ initializeForm(): void
+ loadJobTemplates(): void
+ onFileSelected(event: Event): void
+ triggerFileInput(): void
+ runJob(): void
+ clearForm(): void
```

**JobResultComponent (NEW)**
```
Properties:
+ execution: input.required<JobExecution>

Methods:
+ getStatusColor(): string
+ getStatusIcon(): string
```

**JobHistoryComponent (NEW)**
```
Properties:
+ executions: input.required<JobExecution[]>

Methods:
+ trackByFn(index: number, item: JobExecution): string
```

#### Enums to Add:

**JobStatus Enum**
```
RUNNING = 'RUNNING'
COMPLETED = 'COMPLETED'
FAILED = 'FAILED'
```

**JobExecutionStatus Enum**
```
STARTING = 'STARTING'
RUNNING = 'RUNNING'
COMPLETED = 'COMPLETED'
FAILED = 'FAILED'
```

#### Constants to Show:

**APP_CONSTANTS Object**
```
{
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
  JOB_STATUS_OPTIONS: [...],
  JOB_EXECUTION_STATUS_OPTIONS: [...],
  STATUS_COLOR_MAP: {...},
  DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'
}
```

#### Interfaces to Show:

**JobExecution Interface (NEW)**
```
{
  id: string
  jobName: string
  status: JobExecutionStatus
  startTime: Date
  endTime?: Date
  message?: string
  fileName?: string
}
```

---

### 3. **DATA FLOW DIAGRAM** (data-flow-diagram.drawio)

#### Add New Flows:

**Job Trigger Flow (NEW)**
```
User Input (JobTriggerComponent)
  ↓
Submit Job Execution Form
  ↓
Call JobService.triggerJob(jobName, file)
  ↓
BehaviorSubject receives JobExecution
  ↓
Update JobResultComponent
  ↓
Add to JobHistoryComponent
```

**Job Dashboard Flow**
```
User Opens Dashboard
  ↓
AppShellComponent loads
  ↓
JobDashboardComponent initializes
  ↓
JobSummaryComponent subscribes to jobs$
  ↓
JobTableComponent subscribes with getJobs()
  ↓
MatPaginator handles pagination (5/10/25/50)
  ↓
Display updated table w/ pagination
```

**Pagination & Filtering Flow (NEW)**
```
User Selects Page Size from MatPaginator
  ↓
dataSource.paginator updated (from APP_CONSTANTS)
  ↓
User enters search term
  ↓
searchControl.valueChanges triggered
  ↓
Combined with statusControl filter
  ↓
Filter operators applied (map, filter)
  ↓
Table re-renders with filtered data
```

**Real-time Updates Flow**
```
Component Initialization
  ↓
RxJS interval(5000) started
  ↓
JobService.fetchJobs() called every 5 seconds
  ↓
BehaviorSubject.next(jobs)
  ↓
All subscribers receive updated job list
  ↓
JobTableComponent with pagination re-renders
  ↓
Current page maintained
```

**Execution Status Tracking Flow (NEW)**
```
JobExecutionStatus.STARTING
  ↓
JobExecutionStatus.RUNNING (show spinner)
  ↓
Monitor job progress
  ↓
JobExecutionStatus.COMPLETED or FAILED
  ↓
Update JobResultComponent UI
  ↓
Add to execution history
  ↓
Show completion status
```

#### Color Coding for Flows:
- **Current Implementation**: Solid green lines
- **Real-time Updates**: Solid cyan lines  
- **Pagination**: Solid yellow lines
- **Future Enhancement**: Dashed magenta lines

---

## Implementation Steps

To update these diagrams in draw.io online editor:

1. Open each `.drawio` file at [app.diagrams.net](https://app.diagrams.net)
2. Add new components using "Insert > Shapes > UML" or text boxes
3. Update existing components with new methods and properties
4. Add new data flow arrows with appropriate colors
5. Update colors/styling to distinguish current vs. future features
6. Save and export back to the `draw.io/` folder

---

## Key Changes Summary

### Components Added
- AppShellComponent (responsive navigation)
- JobTriggerComponent (job execution form)
- JobResultComponent (execution result display)
- JobHistoryComponent (execution history list)

### Features Added
- Pagination with configurable page sizes (5, 10, 25, 50)
- Type-safe status management (JobStatus, JobExecutionStatus enums)
- Centralized constants (APP_CONSTANTS object)
- Job execution workflow
- Real-time updates (5-second polling)

### Data Models Enhanced
- JobExecution interface (new)
- Constants and Enums module (new)
- Updated JobTableComponent with pagination

### Service Layer Updates
- triggerJob() method added
- getJobTemplates() method added
- Pagination support integrated
- Filter/search with RxJS operators

---

*Last Updated: March 18, 2026*
*All components follow Angular 21 best practices with standalone component architecture*
