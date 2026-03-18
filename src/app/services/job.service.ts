/**
 * Service responsible for retrieving job data and triggering manual jobs.
 *
 * Currently uses mock data, but is designed to be replaced with real HTTP
 * API calls in a future iteration.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, startWith, switchMap, map, delay, tap, concat } from 'rxjs';
import { Job, JobExecution } from '../models/job.model';
import { mockJobs, jobTemplates } from '../mocks/mock-jobs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  /**
   * BehaviorSubject used to provide an observable stream of job updates.
   */
  private jobsSubject = new BehaviorSubject<Job[]>(mockJobs);

  /**
   * Public observable consumers should subscribe to this property.
   */
  public jobs$ = this.jobsSubject.asObservable();

  constructor() {
    // Auto refresh every 5 seconds using RxJS interval.
    // This simulates a polling mechanism to keep the dashboard up-to-date.
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.fetchJobs())
    ).subscribe(jobs => this.jobsSubject.next(jobs));
  }

  /**
   * Returns the current job stream (updates on refresh).
   */
  getJobs(): Observable<Job[]> {
    return this.jobs$;
  }

  /**
   * Returns a single job by ID (useful for details view).
   */
  getJobById(id: string): Observable<Job | undefined> {
    return this.jobs$.pipe(
      map(jobs => jobs.find(job => job.id === id))
    );
  }

  /**
   * Fetches jobs from the data source.
   * In the future this will become an HTTP call to /api/jobs.
   */
  private fetchJobs(): Observable<Job[]> {
    // Mock data for now.
    return of(mockJobs);
  }

  /**
   * Returns available job templates for manual triggering.
   */
  getJobTemplates(): Observable<typeof jobTemplates> {
    return of(jobTemplates);
  }

  /**
   * Triggers a job execution with optional file upload.
   * Simulates API call: POST /api/jobs/trigger
   * 
   * @param jobName - Name of the job to trigger
   * @param file - Optional file to process
   * @returns Observable<JobExecution> - Job execution status updates
   */
  triggerJob(jobName: string, file?: File): Observable<JobExecution> {
    // Phase 1: Initial state
    const startExecution: JobExecution = {
      id: Date.now().toString(),
      jobName,
      status: 'STARTING',
      startTime: new Date(),
      fileName: file?.name,
      message: 'Initializing job execution...'
    };

    // Phase 2: Running state
    const runningExecution: JobExecution = {
      ...startExecution,
      status: 'RUNNING',
      message: file
        ? `Processing file: ${file.name}...`
        : 'Executing job without file...'
    };

    // Phase 3: Completion state (80% success rate)
    const isSuccess = Math.random() > 0.2;
    const completedExecution: JobExecution = {
      ...runningExecution,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      endTime: new Date(),
      message: isSuccess
        ? file
          ? `Successfully processed ${file.name}`
          : 'Job completed successfully'
        : 'Job execution failed: Service timeout'
    };

    // Emit three times to show progress, then emit final result
    return concat(
      of(startExecution).pipe(delay(800)),
      of(runningExecution).pipe(delay(2000)),
      of(completedExecution).pipe(delay(500))
    );
  }
}
