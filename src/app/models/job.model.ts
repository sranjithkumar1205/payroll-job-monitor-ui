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