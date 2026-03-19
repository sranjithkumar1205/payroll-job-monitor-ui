# Payroll Job Monitor - Data Flow Diagram

```mermaid
graph TD
    %% FLOW 1: Application Initialization
    subgraph Flow1["FLOW 1: Application Initialization & Environment Setup"]
        F1_1["Browser Loads main.ts"] --> F1_2["bootstrapApplication<br/>AppComponent"]
        F1_2 --> F1_3["AppShellComponent created"]
        F1_3 --> F1_4["ngOnInit executes"]
        F1_4 --> F1_5["Router.events subscription<br/>listening for NavigationEnd"]
        F1_5 --> F1_6["BreakpointObserver detects<br/>device type"]
        F1_6 --> F1_7["sidenavOpen signal<br/>= false mobile / true desktop"]
        F1_7 --> F1_8["pageTitle signal<br/>= APP_CONSTANTS.<br/>DEFAULT_PAGE_TITLE"]
        F1_8 --> F1_9["✅ App Shell Ready<br/>with Sidenav + Toolbar"]
    end

    %% FLOW 2: Job Execution Flow
    subgraph Flow2["FLOW 2: Job Execution (JobTriggerComponent)"]
        F2_1["User navigates to<br/>/trigger route"] --> F2_2["Router emits<br/>NavigationEnd event"]
        F2_2 --> F2_3["AppShellComponent detects<br/>NavigationEnd in subscription"]
        F2_3 --> F2_4["pageTitle.set<br/>Job Execution Form"]
        F2_4 --> F2_5["JobTriggerComponent<br/>renders in router-outlet"]
        F2_5 --> F2_6["User fills form:<br/>• Select job template<br/>• Optional: upload CSV<br/>• Click Run Job"]
        F2_6 --> F2_7["runJob method called"]
        F2_7 --> F2_8["FormBuilder validators<br/>check validity"]
        F2_8 --> F2_9["Create JobExecution<br/>status = STARTING<br/>enum"]
        F2_9 --> F2_10["Call JobService<br/>.triggerJob execution"]
        F2_10 --> F2_11["JobService adds to<br/>jobsSubject<br/>BehaviorSubject"]
        F2_11 --> F2_12["Set isExecuting = true"]
        F2_12 --> F2_13["RxJS interval 5000ms<br/>polling starts"]
        F2_13 --> F2_14["Poll fetches latest<br/>execution status"]
        F2_14 --> F2_15{"Execution<br/>Complete?"}
        F2_15 -->|No| F2_16["Status: RUNNING<br/>repeat poll"]
        F2_16 --> F2_14
        F2_15 -->|Yes| F2_17["Status: COMPLETED<br/>or FAILED"]
        F2_17 --> F2_18["lastExecution signal<br/>updated"]
        F2_18 --> F2_19["executionHistory signal<br/>updated"]
        F2_19 --> F2_20["JobResultComponent<br/>displays result"]
        F2_20 --> F2_21{"Status<br/>Type?"}
        F2_21 -->|COMPLETED| F2_22["Green #4caf50"]
        F2_21 -->|RUNNING| F2_23["Orange #ff9800"]
        F2_21 -->|FAILED| F2_24["Red #f44336"]
        F2_22 --> F2_25["✅ Execution Complete<br/>Status: Visible to User"]
        F2_23 --> F2_25
        F2_24 --> F2_25
    end

    %% FLOW 3: Job List & Pagination
    subgraph Flow3["FLOW 3: Job List & Pagination (JobTableComponent)"]
        F3_1["User navigates to<br/>/dashboard route"] --> F3_2["pageTitle.set<br/>Dashboard"]
        F3_2 --> F3_3["JobDashboardComponent<br/>initializes"]
        F3_3 --> F3_4["JobSummaryComponent<br/>loads job stats"]
        F3_4 --> F3_5["JobService.getJobs<br/>observable"]
        F3_5 --> F3_6["Mock data loaded<br/>all jobs"]
        F3_6 --> F3_7["Calculate stats:<br/>• Running count<br/>• Completed count<br/>• Failed count"]
        F3_7 --> F3_8["Stats displayed<br/>in cards"]
        F3_8 --> F3_9["JobTableComponent<br/>ngAfterViewInit"]
        F3_9 --> F3_10["MatPaginator connected<br/>Page sizes: [5,10,25,50]<br/>From APP_CONSTANTS"]
        F3_10 --> F3_11["MatTableDataSource<br/>initialized with jobs"]
        F3_11 --> F3_12["Default page size<br/>= APP_CONSTANTS.<br/>DEFAULT_PAGE_SIZE 10"]
        F3_12 --> F3_13["Paginator renders<br/>showing page 1"]
        F3_13 --> F3_14["searchControl & statusControl<br/>initialized as FormControls"]
        F3_14 --> F3_15["RxJS combineLatest<br/>search + status"]
        F3_15 --> F3_16["User types search<br/>or selects status filter"]
        F3_16 --> F3_17["FormControl.valueChanges<br/>emits new value"]
        F3_17 --> F3_18["combineLatest pipes:<br/>• map(filter)<br/>• debounceTime(300)<br/>• distinctUntilChanged"]
        F3_18 --> F3_19["dataSource.filter<br/>= combined filters"]
        F3_19 --> F3_20["MatTable re-renders<br/>filtered results"]
        F3_20 --> F3_21["User changes page size<br/>or clicks next page"]
        F3_21 --> F3_22["Paginator emits<br/>pageChange event"]
        F3_22 --> F3_23["dataSource.<br/>paginator.pageIndex<br/>updated"]
        F3_23 --> F3_24["MatTable shows<br/>current page<br/>5-50 items"]
        F3_24 --> F3_25["Each status cell<br/>colored using<br/>APP_CONSTANTS<br/>.STATUS_COLOR_MAP"]
        F3_25 --> F3_26["User clicks row"]
        F3_26 --> F3_27["JobDetailsComponent<br/>opens as MatDialog"]
        F3_27 --> F3_28["✅ Full pagination<br/>& filtering working"]
    end

    %% FLOW 4: Sidenav Navigation
    subgraph Flow4["FLOW 4: Sidenav Navigation (AppShellComponent)"]
        F4_1["User clicks<br/>hamburger menu"] --> F4_2["toggleSidenav called"]
        F4_2 --> F4_3["sidenavOpen.set<br/>!sidenavOpen"]
        F4_3 --> F4_4["MatSidenav template<br/>watches signal"]
        F4_4 --> F4_5["[opened]=sidenavOpen<br/>reactive binding"]
        F4_5 --> F4_6["Sidenav slides in/out<br/>with animation"]
        F4_6 --> F4_7["User clicks nav item<br/>e.g. Job Execution"]
        F4_7 --> F4_8["Router.navigate<br/>['/trigger']"]
        F4_8 --> F4_9["Router state changes"]
        F4_9 --> F4_10["Router emits<br/>NavigationEnd event"]
        F4_10 --> F4_11["AppShellComponent<br/>subscription triggered"]
        F4_11 --> F4_12["Parse event.url"]
        F4_12 --> F4_13{"URL<br/>Contains?"}
        F4_13 -->|/trigger| F4_14["pageTitle<br/>=Job Execution Form"]
        F4_13 -->|/dashboard| F4_15["pageTitle<br/>=Dashboard"]
        F4_13 -->|other| F4_16["pageTitle<br/>=DEFAULT_TITLE"]
        F4_14 --> F4_17["Component loads in<br/>router-outlet"]
        F4_15 --> F4_17
        F4_16 --> F4_17
        F4_17 --> F4_18["Page title updated<br/>in MatToolbar"]
        F4_18 --> F4_19{"Mobile<br/>Device?"}
        F4_19 -->|Yes| F4_20["sidenavOpen = false<br/>auto-close"]
        F4_19 -->|No| F4_21["sidenavOpen = true<br/>keep open"]
        F4_20 --> F4_22["✅ Navigation complete<br/>UI updated"]
        F4_21 --> F4_22
    end

    %% FLOW 5: Constants & Enums Usage
    subgraph Flow5["FLOW 5: Constants & Enums Type-Safety Pattern"]
        F5_1["Component imports:<br/>APP_CONSTANTS<br/>JobStatus enum<br/>JobExecutionStatus enum"] --> F5_2["Pattern 1: Type-Safe Comparison<br/>if job.status===<br/>JobStatus.COMPLETED"]
        F5_2 --> F5_3["✅ Compiler catches<br/>typos at build time<br/>❌ No 'COMPLTED'<br/>allowed"]
        F5_3 --> F5_4["Pattern 2: Color Mapping<br/>color = APP_CONSTANTS<br/>.STATUS_COLOR_MAP<br/>[status]"]
        F5_4 --> F5_5["✅ Single source<br/>of truth for colors<br/>Change once = everywhere"]
        F5_5 --> F5_6["Pattern 3: Pagination Setup<br/>pageSizeOptions =<br/>APP_CONSTANTS<br/>.PAGE_SIZE_OPTIONS"]
        F5_6 --> F5_7["✅ Consistent across<br/>all tables"]
        F5_7 --> F5_8["Pattern 4: Filter Options<br/>statusOptions =<br/>APP_CONSTANTS<br/>.JOB_STATUS_OPTIONS"]
        F5_8 --> F5_9["✅ Dropdown values<br/>synchronized with<br/>enum definitions"]
        F5_9 --> F5_10["Pattern 5: Dynamic Strings<br/>pageTitle =<br/>APP_CONSTANTS<br/>.DEFAULT_PAGE_TITLE"]
        F5_10 --> F5_11["✅ All App Constants<br/>in one file"]
        F5_11 --> F5_12["Benefits Summary:<br/>• Type Safety<br/>• IDE Autocompletion<br/>• No Runtime String Errors<br/>• Easy Maintenance<br/>• Central Configuration"]
        F5_12 --> F5_13["✅ Constants Pattern<br/>Established Across App"]
    end

    %% Styling
    classDef initFlow fill:#4488ff,stroke:#0066cc,color:#fff,stroke-width:2px
    classDef execFlow fill:#44ff44,stroke:#00cc00,color:#000,stroke-width:2px
    classDef tableFlow fill:#ffcc44,stroke:#cc8800,color:#000,stroke-width:2px
    classDef navFlow fill:#ff88ff,stroke:#cc00cc,color:#fff,stroke-width:2px
    classDef constFlow fill:#ff8844,stroke:#cc4400,color:#fff,stroke-width:2px
    
    classDef flowGroup1 fill:#1a1a3a,stroke:#4488ff,color:#fff,stroke-width:3px
    classDef flowGroup2 fill:#1a3a1a,stroke:#44ff44,color:#fff,stroke-width:3px
    classDef flowGroup3 fill:#3a3a1a,stroke:#ffcc44,color:#000,stroke-width:3px
    classDef flowGroup4 fill:#3a1a3a,stroke:#ff88ff,color:#fff,stroke-width:3px
    classDef flowGroup5 fill:#3a2a1a,stroke:#ff8844,color:#fff,stroke-width:3px
    
    class F1_1,F1_2,F1_3,F1_4,F1_5,F1_6,F1_7,F1_8,F1_9 initFlow
    class F2_1,F2_2,F2_3,F2_4,F2_5,F2_6,F2_7,F2_8,F2_9,F2_10,F2_11,F2_12,F2_13,F2_14,F2_15,F2_16,F2_17,F2_18,F2_19,F2_20,F2_21,F2_22,F2_23,F2_24,F2_25 execFlow
    class F3_1,F3_2,F3_3,F3_4,F3_5,F3_6,F3_7,F3_8,F3_9,F3_10,F3_11,F3_12,F3_13,F3_14,F3_15,F3_16,F3_17,F3_18,F3_19,F3_20,F3_21,F3_22,F3_23,F3_24,F3_25,F3_26,F3_27,F3_28 tableFlow
    class F4_1,F4_2,F4_3,F4_4,F4_5,F4_6,F4_7,F4_8,F4_9,F4_10,F4_11,F4_12,F4_13,F4_14,F4_15,F4_16,F4_17,F4_18,F4_19,F4_20,F4_21,F4_22 navFlow
    class F5_1,F5_2,F5_3,F5_4,F5_5,F5_6,F5_7,F5_8,F5_9,F5_10,F5_11,F5_12,F5_13 constFlow
    
    class Flow1 flowGroup1
    class Flow2 flowGroup2
    class Flow3 flowGroup3
    class Flow4 flowGroup4
    class Flow5 flowGroup5
```

## Detailed Data Flow Descriptions

### FLOW 1: Application Initialization & Environment Setup (BLUE)

**Purpose**: Initialize the AppShellComponent as the root navigation container

**Key Steps**:
1. Main.ts bootstraps the Angular application
2. AppComponent created and rendered
3. AppShellComponent initializes as root container
4. ngOnInit subscribes to Router.events with NavigationEnd filter
5. BreakpointObserver monitors viewport for responsive behavior
6. sidenavOpen signal set based on device type (mobile/desktop)
7. pageTitle signal initialized to default title
8. Application ready with navigation shell

**Signals Activated**:
- `sidenavOpen`: Controls sidenav visibility
- `isMobile`: Tracks device type
- `pageTitle`: Displays current page title

---

### FLOW 2: Job Execution (JobTriggerComponent) - GREEN

**Purpose**: Allow user to manually trigger job execution with file upload and monitoring

**Key Steps**:
1. User navigates to `/trigger` route (clicks "Job Execution" in sidenav)
2. Router emits NavigationEnd event
3. AppShellComponent subscription detects URL change
4. pageTitle updated to "Job Execution Form"
5. JobTriggerComponent renders showing job template selector, file upload, history
6. User fills form:
   - Selects job template from dropdown (required)
   - Optionally uploads CSV file
   - Clicks "Run Job" button
7. runJob() method executes:
   - Validates form using FormBuilder validators
   - Creates JobExecution object with `status = JobExecutionStatus.STARTING`
   - Calls `JobService.triggerJob(execution)`
8. JobService adds execution to jobsSubject
9. isExecuting signal set to true
10. RxJS polling begins (5000ms interval)
11. Each poll fetches latest execution status
12. Status progresses: STARTING → RUNNING → (COMPLETED or FAILED)
13. lastExecution signal updated with final result
14. executionHistory signal appends new execution
15. JobResultComponent displays result:
    - COMPLETED: Green (#4caf50)
    - RUNNING: Orange (#ff9800)
    - FAILED: Red (#f44336)
16. User can view full history of executions

**Error Handling**:
- Form validation prevents invalid submissions
- RxJS error handling catches polling failures
- Status comparison uses JobExecutionStatus enum (type-safe)

---

### FLOW 3: Job List & Pagination (JobTableComponent) - YELLOW

**Purpose**: Display paginated list of jobs with filtering and search capability

**Key Steps**:
1. User navigates to `/dashboard` route
2. pageTitle updated to "Dashboard"
3. JobDashboardComponent initializes
4. JobSummaryComponent calculates stats from JobService.getJobs():
   - Total jobs count
   - Running jobs (JobStatus.RUNNING)
   - Completed jobs (JobStatus.COMPLETED)
   - Failed jobs (JobStatus.FAILED)
5. Stats displayed in material cards
6. JobTableComponent ngAfterViewInit() executes:
   - MatPaginator connected to MatTableDataSource
   - Page size options: [5, 10, 25, 50] from APP_CONSTANTS
   - Default page size: 10
7. MatTableDataSource initialized with all jobs
8. First page (10 items) rendered
9. Search and status filter controls initialized:
   - searchControl: Text input
   - statusControl: Status dropdown with APP_CONSTANTS.JOB_STATUS_OPTIONS
10. RxJS reactive filtering with combineLatest:
    - Both controls emit value changes
    - Combined with map, debounceTime(300), distinctUntilChanged
11. User interacts with filters:
    - Types search text
    - Selects status from dropdown
12. Combined filter applied to dataSource
13. MatTable re-renders with filtered results
14. User changes page:
    - Clicks page size dropdown → updates PAGE_SIZE_OPTIONS
    - Clicks next/previous/page number → paginator updates
15. Paginator emits pageChange event
16. dataSource reflects new page
17. Each row's status cell colored using APP_CONSTANTS.STATUS_COLOR_MAP
18. User clicks row → JobDetailsComponent opens as MatDialog
19. Full pagination and filtering workflow complete

**RxJS Operators Used**:
- `valueChanges`: Track form control changes
- `combineLatest`: Combine search + status streams
- `map`: Transform filter values
- `debounceTime`: Debounce rapid inputs (300ms)
- `distinctUntilChanged`: Skip duplicate values
- `pipe`: Chain operators

---

### FLOW 4: Sidenav Navigation (AppShellComponent) - MAGENTA

**Purpose**: Navigate between application sections with responsive sidenav

**Key Steps**:
1. User clicks hamburger menu (mobile) or sidenav item
2. toggleSidenav() called
3. sidenavOpen signal toggled: `!sidenavOpen()`
4. MatSidenav template bound to signal with `[opened]="sidenavOpen()"`
5.​ Sidenav slides in/out with material animation
6. User clicks navigation item (e.g., "Job Execution")
7. Router.navigate(['/trigger']) called
8. Router updates internal state
9. Router emits NavigationEnd event
10. AppShellComponent subscription triggered
11. Event URL parsed and matched:
    - If URL includes `/trigger` → pageTitle = "Job Execution Form"
    - If URL includes `/dashboard` → pageTitle = "Dashboard"
    - Otherwise → pageTitle = APP_CONSTANTS.DEFAULT_PAGE_TITLE
12. Corresponding component loads in router-outlet
13. BreakpointObserver checks if device is mobile:
    - If mobile: `sidenavOpen.set(false)` → sidenav auto-closes
    - If desktop: sidenav stays open
14. MatToolbar displays updated pageTitle
15. New view fully rendered and interactive

**Responsive Behavior**:
- Mobile (< 768px): Sidenav slides over content, auto-closes on navigation
- Desktop (≥ 768px): Sidenav stays open alongside content

---

### FLOW 5: Constants & Enums Type-Safety Pattern - ORANGE

**Purpose**: Establish centralized configuration and type-safe state management

**Key Steps**:

1. **Pattern 1: Type-Safe Enum Comparison**
   ```typescript
   import { JobStatus, JobExecutionStatus } from './constants'
   
   if (job.status === JobStatus.COMPLETED) { /* type-safe */ }
   // ❌ Cannot write: JobStatus.COMPLTED (typo caught at compile time)
   ```

2. **Pattern 2: Color Mapping from Constants**
   ```typescript
   color = APP_CONSTANTS.STATUS_COLOR_MAP[status]
   // Centralized: Change color once, applies everywhere
   // Example: JobStatus.COMPLETED → #4caf50 (green)
   ```

3. **Pattern 3: Pagination Configuration**
   ```typescript
   pageSizeOptions = APP_CONSTANTS.PAGE_SIZE_OPTIONS // [5, 10, 25, 50]
   // Consistent across all tables in app
   ```

4. **Pattern 4: Filter Options Synchronized with Enums**
   ```typescript
   statusOptions = APP_CONSTANTS.JOB_STATUS_OPTIONS
   // Dropdown values match enum definitions automatically
   ```

5. **Pattern 5: Dynamic String Values**
   ```typescript
   pageTitle = APP_CONSTANTS.DEFAULT_PAGE_TITLE
   // All app strings in one configuration object
   ```

**Benefits Achieved**:
✅ **Type Safety**: Compiler catches string typos at build time
✅ **IDE Autocompletion**: Developer suggestions for valid values
✅ **No Runtime Errors**: String comparison bugs eliminated
✅ **Easy Maintenance**: Update once, applies globally
✅ **Central Configuration**: All constants in one file (src/app/models/constants.ts)
✅ **Consistency**: Ensures same values used everywhere

**Usage Pattern Established**:
- All components that need configuration import from constants.ts
- No hardcoded strings or magic numbers in component logic
- Single source of truth for enums, colors, sizes, labels

