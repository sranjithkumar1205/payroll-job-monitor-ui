/**
 * Application-wide constants and enums
 */

/**
 * Job status enumeration for type-safe status values
 */
export enum JobStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Job execution status enumeration
 */
export enum JobExecutionStatus {
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Application-wide constants
 *
 * Using a single `APP_CONSTANTS` object (marked `as const`) ensures all
 * consuming components stay in sync — change a value here once and it
 * propagates everywhere automatically.
 */
export const APP_CONSTANTS = {
  // ─── Pagination ─────────────────────────────────────────────────────────────
  // Sent as the `size` query parameter on the first page load.
  DEFAULT_PAGE_SIZE: 10,

  // Choices rendered inside MatPaginator's page-size dropdown.
  // Backend must support any of these values via its `size` query param.
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],

  // ─── Job statuses for UI ────────────────────────────────────────────────────
  // Populates the status filter dropdown.  The empty-string entry means "All".
  JOB_STATUS_OPTIONS: [
    { value: '', label: 'All' },
    { value: JobStatus.RUNNING, label: 'Running' },
    { value: JobStatus.COMPLETED, label: 'Completed' },
    { value: JobStatus.FAILED, label: 'Failed' }
  ],

  // Populates dropdowns / displays where execution lifecycle states are shown.
  JOB_EXECUTION_STATUS_OPTIONS: [
    { value: JobExecutionStatus.STARTING, label: 'Starting' },
    { value: JobExecutionStatus.RUNNING, label: 'Running' },
    { value: JobExecutionStatus.COMPLETED, label: 'Completed' },
    { value: JobExecutionStatus.FAILED, label: 'Failed' }
  ],

  // ─── Angular Material theme palette mappings ─────────────────────────────────
  // Maps each job status to a Material theme color token used by <mat-chip>.
  //   'accent'  = orange  (in-progress)
  //   'primary' = indigo  (successful)
  //   'warn'    = red     (failed)
  STATUS_COLOR_MAP: {
    [JobStatus.RUNNING]: 'accent',
    [JobStatus.COMPLETED]: 'primary',
    [JobStatus.FAILED]: 'warn'
  },

  // ─── Miscellaneous ───────────────────────────────────────────────────────────
  // Fallback title shown in the toolbar when no route-specific title is set.
  DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'
} as const;
