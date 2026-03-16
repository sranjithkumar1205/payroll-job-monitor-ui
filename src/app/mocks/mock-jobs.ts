import { Job } from '../models/job.model';

/**
 * Fixed mock dataset used by the JobService while this project is not yet connected
 * to a real backend API.
 */
export const mockJobs: Job[] = [
  {
    id: '1',
    jobName: 'Payroll Calculation Job',
    status: 'RUNNING',
    startTime: new Date('2026-03-16T10:00:00'),
  },
  {
    id: '2',
    jobName: 'Employee Data Sync',
    status: 'COMPLETED',
    startTime: new Date('2026-03-16T09:00:00'),
    endTime: new Date('2026-03-16T09:30:00'),
    duration: 30 * 60 * 1000, // 30 minutes
  },
  {
    id: '3',
    jobName: 'Tax Report Generation',
    status: 'FAILED',
    startTime: new Date('2026-03-16T08:00:00'),
    endTime: new Date('2026-03-16T08:15:00'),
    duration: 15 * 60 * 1000,
    errorMessage: 'Database connection timeout',
  },
  {
    id: '4',
    jobName: 'Salary Deposit Job',
    status: 'COMPLETED',
    startTime: new Date('2026-03-16T07:00:00'),
    endTime: new Date('2026-03-16T07:45:00'),
    duration: 45 * 60 * 1000,
  },
  {
    id: '5',
    jobName: 'Audit Log Processing',
    status: 'RUNNING',
    startTime: new Date('2026-03-16T11:00:00'),
  },
];