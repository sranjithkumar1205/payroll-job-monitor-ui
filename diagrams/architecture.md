# Payroll Job Monitor - Architecture Diagram

```mermaid
graph TD
    subgraph AppShell["AppShellComponent (Navigation Root)"]
        direction LR
        Sidenav["MatSidenav<br/>Responsive Sidebar<br/>BreakpointObserver"]
        Toolbar["MatToolbar<br/>Page Title Signal<br/>Toggle Button"]
        Outlet["router-outlet<br/>Dynamic Content"]
        
        Sidenav --> NavItems["Navigation Items<br/>• Dashboard<br/>• Job Execution<br/>• Settings"]
        Toolbar --> Title["pageTitle Signal<br/>Default: 'Payroll Job Monitor'"]
    end
    
    subgraph UILayer["User Interface Layer"]
        direction TB
        Dashboard["JobDashboardComponent"]
        JobTrigger["JobTriggerComponent<br/>(JOB EXECUTION FORM)<br/>---<br/>• Job Template Selector<br/>• File Upload Input<br/>• Run Job Button<br/>• Execution History"]
        Summary["JobSummaryComponent<br/>Stats Cards"]
        Table["JobTableComponent<br/>with MatPaginator<br/>---<br/>Page Sizes: 5,10,25,50<br/>From APP_CONSTANTS"]
        Details["JobDetailsComponent<br/>Dialog View"]
        Result["JobResultComponent<br/>Status Display<br/>Color Coded"]
    end
    
    subgraph ServiceLayer["Service Layer"]
        direction TB
        JobService["JobService<br/>---<br/>• getJobs()<br/>• triggerJob(job)<br/>• jobsSubject<br/>  BehaviorSubject<br/>• Poll: 5000ms"]
    end
    
    subgraph Models["Models & Constants Layer"]
        direction TB
        Enums["Enums<br/>---<br/>JobStatus<br/>• RUNNING<br/>• COMPLETED<br/>• FAILED<br/><br/>JobExecutionStatus<br/>• STARTING<br/>• RUNNING<br/>• COMPLETED<br/>• FAILED"]
        Constants["APP_CONSTANTS<br/>---<br/>• PAGE_SIZE_OPTIONS<br/>• JOB_STATUS_OPTIONS<br/>• STATUS_COLOR_MAP<br/>• DEFAULT_PAGE_TITLE"]
    end
    
    subgraph DataLayer["Data Layer"]
        direction TB
        Mock["Mock Jobs Data<br/>Job[] with<br/>Execution History"]
        API["API Gateway<br/>(Future)<br/>dashed"]
    end
    
    subgraph External["External Systems"]
        direction TB
        Payroll["Payroll Processing<br/>System"]
        Database["Database"]
    end
    
    %% Connections
    AppShell --> Outlet
    Outlet --> Dashboard
    Outlet --> JobTrigger
    
    Dashboard --> Summary
    Dashboard --> Table
    
    Summary --> JobService
    Table --> JobService
    Details --> JobService
    JobTrigger --> JobService
    Result --> JobService
    
    JobService --> Mock
    JobService -.->|Future| API
    
    Table --> Result
    
    JobService --> Enums
    Table --> Constants
    JobTrigger --> Constants
    Result --> Enums
    
    API -.->|Future| Payroll
    Payroll --> Database
    
    %% Styling
    classDef navComponent fill:#ff00ff,stroke:#00ffff,color:#fff,stroke-width:3px
    classDef uiComponent fill:#00ffff,stroke:#00ffff,color:#000,stroke-width:2px
    classDef service fill:#00ffff,stroke:#00ffff,color:#000,stroke-width:2px
    classDef models fill:#ff6600,stroke:#ff6600,color:#fff,stroke-width:2px
    classDef data fill:#ffff00,stroke:#ffff00,color:#000,stroke-width:2px
    classDef external fill:#ff66ff,stroke:#ff66ff,color:#fff,stroke-width:2px
    classDef future fill:#ff00ff,stroke:#ff00ff,color:#fff,stroke-width:2px,stroke-dasharray: 5 5
    
    class AppShell navComponent
    class Sidenav,Toolbar navComponent
    class Dashboard,JobTrigger,Summary,Table,Details,Result uiComponent
    class JobService service
    class Enums,Constants models
    class Mock data
    class API future
    class Payroll,Database external
```

## Architecture Overview

### AppShellComponent (Navigation Root - MAGENTA)
- **Root container** presenting the entire application shell
- **MatSidenav**: Responsive sidebar navigation
  - BreakpointObserver detects mobile (< 768px) vs desktop
  - Auto-closes on mobile, stays open on desktop
  - Navigation items: Dashboard, Job Execution, Settings
- **MatToolbar**: Top navigation bar with:
  - Page title signal (updated based on current route)
  - Hamburger toggle button for sidenav
- **router-outlet**: Placeholder for routed components

### UI Components Layer (CYAN)
- **JobTriggerComponent** (NEW - Job Execution Form):
  - Form to manually trigger job execution
  - Job template selector (dropdown)
  - File upload input for CSV data
  - Execution history display
  - Uses JobExecutionStatus enum for status comparison
  - Emits to JobService when "Run Job" clicked

- **JobDashboardComponent** (CYAN):
  - Main dashboard view after routing to /dashboard
  - Contains JobSummaryComponent and JobTableComponent

- **JobTableComponent** (CYAN - Updated with Pagination):
  - Displays all jobs in MatTable
  - MatPaginator integration (page sizes: 5, 10, 25, 50)
  - Filtering: search + status dropdown
  - Status color-coded using APP_CONSTANTS.STATUS_COLOR_MAP
  - Each row clickable to open JobDetailsComponent

- **JobResultComponent** (CYAN):
  - Shows execution result with dynamic styling
  - Uses JobExecutionStatus enum for color mapping
  - Displays timestamps and messages

### Service Layer (CYAN)
- **JobService**:
  - Central data service
  - Manages jobs via BehaviorSubject
  - Polls data every 5 seconds (RxJS interval)
  - Methods: getJobs(), triggerJob(), getJobDetails()
  - Currently uses mock data; ready for API integration

### Models & Constants Layer (ORANGE - NEW)
- **JobStatus enum**:
  - RUNNING, COMPLETED, FAILED
  - Used for Job model status field
  
- **JobExecutionStatus enum**:
  - STARTING, RUNNING, COMPLETED, FAILED
  - Used for JobExecution model status field
  
- **APP_CONSTANTS object**:
  - PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
  - JOB_STATUS_OPTIONS: status dropdown values
  - STATUS_COLOR_MAP: status → color mapping
  - DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'
  - Single source of truth for configuration

### Data Layer (YELLOW)
- **Mock Jobs Data**: Job[] array with execution history
- **Future API Gateway** (dashed): Placeholder for future backend integration

### External Systems (MAGENTA dashed)
- **Payroll Processing System**: Future external system
- **Database**: Backend data persistence
