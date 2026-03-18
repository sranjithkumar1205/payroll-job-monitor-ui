/**
 * Represents a single payroll batch job run.
 *
 * This is the canonical model used across the dashboard.
 */
export interface Job {
  id: string;
  jobName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  errorMessage?: string;
}

/**
 * Represents the trigger/execution result of a manual job trigger.
 */
export interface JobExecution {
  id: string;
  jobName: string;
  status: 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  message?: string;
  fileName?: string;
}

/**
 * Available jobs that can be manually triggered.
 */
export interface JobTemplate {
  id: string;
  name: string;
  description: string;
}