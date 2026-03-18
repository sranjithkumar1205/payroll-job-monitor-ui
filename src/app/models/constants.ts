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
 */
export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],

  // Job statuses for UI
  JOB_STATUS_OPTIONS: [
    { value: '', label: 'All' },
    { value: JobStatus.RUNNING, label: 'Running' },
    { value: JobStatus.COMPLETED, label: 'Completed' },
    { value: JobStatus.FAILED, label: 'Failed' }
  ],

  // Job execution statuses for UI
  JOB_EXECUTION_STATUS_OPTIONS: [
    { value: JobExecutionStatus.STARTING, label: 'Starting' },
    { value: JobExecutionStatus.RUNNING, label: 'Running' },
    { value: JobExecutionStatus.COMPLETED, label: 'Completed' },
    { value: JobExecutionStatus.FAILED, label: 'Failed' }
  ],

  // Material theme color mappings
  STATUS_COLOR_MAP: {
    [JobStatus.RUNNING]: 'accent',
    [JobStatus.COMPLETED]: 'primary',
    [JobStatus.FAILED]: 'warn'
  },

  // Default page title
  DEFAULT_PAGE_TITLE: 'Payroll Job Monitor'
} as const;
