import { Job, JobTemplate } from '../models/job.model';

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

/**
 * Job templates available for manual triggering.
 */
export const jobTemplates: JobTemplate[] = [
  {
    id: '1',
    name: 'Payroll Job',
    description: 'Calculate and process payroll for all employees'
  },
  {
    id: '2',
    name: 'Employee Import',
    description: 'Import employee data from external source'
  },
  {
    id: '3',
    name: 'Salary Sync',
    description: 'Synchronize salary information across systems'
  },
  {
    id: '4',
    name: 'Tax Report',
    description: 'Generate monthly tax reports'
  },
  {
    id: '5',
    name: 'Compliance Check',
    description: 'Run compliance validation checks'
  }
];