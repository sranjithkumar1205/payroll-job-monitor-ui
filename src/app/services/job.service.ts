/**
 * Service responsible for retrieving job data and triggering manual jobs.
 *
 * Makes HTTP API calls to the backend for job data and triggering.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, delay, concat, map, tap } from 'rxjs';
import { Job, JobExecution } from '../models/job.model';
import { Page } from '../models/page.model';
import { mockJobs, jobTemplates } from '../mocks/mock-jobs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly apiUrl = 'http://localhost:8080/api/jobs';

  /**
   * Shared broadcast of the most-recent getJobs() response.
   * Starts as null (no data yet). job-table drives updates by calling getJobs();
   * job-summary (and any other consumer) subscribes here instead of making
   * its own HTTP request, which eliminates duplicate API calls.
   */
  private readonly _latestPage = new BehaviorSubject<Page<JobExecution> | null>(null);
  readonly latestPage$ = this._latestPage.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Fetches a paginated list of jobs from the backend.
   *
   * Sends a GET request to `GET /api/jobs` with the following query parameters:
   *   - `page`    — Zero-based page index (Spring convention)
   *   - `size`    — Number of records per page
   *   - `sortBy`  — Entity field name to sort results by
   *   - `sortDir` — Direction: "asc" (oldest first) or "desc" (newest first)
   *
   * The backend is expected to return a Spring `Page<JobExecution>` JSON object
   * containing `content[]`, `totalElements`, `totalPages`, `number`, `size`, etc.
   *
   * @param page    - Zero-based page index (default: 0)
   * @param size    - Number of items per page (default: 10)
   * @param sortBy  - Field to sort by (default: "startTime")
   * @param sortDir - Sort direction "asc" or "desc" (default: "desc")
   * @returns Observable<Page<JobExecution>> wrapping the paginated job data
   */
  getJobs(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'startTime',
    sortDir: 'asc' | 'desc' = 'desc',
    jobName: string = '',
    status: string = ''
  ): Observable<Page<JobExecution>> {
    // Build immutable HttpParams — each `.set()` returns a new instance.
    // This produces a URL like: /api/jobs?page=0&size=10&sortBy=startTime&sortDir=desc
    let params = new HttpParams()
      .set('page', page.toString())    // zero-based page number
      .set('size', size.toString())    // items per page
      .set('sortBy', sortBy)           // sort field name
      .set('sortDir', sortDir);        // 'asc' or 'desc'

    const trimmedJobName = jobName.trim();
    if (trimmedJobName) {
      params = params.set('jobName', trimmedJobName);
    }

    if (status) {
      params = params.set('status', status);
    }

    // Angular HttpClient automatically deserialises the JSON response body
    // into the typed Page<JobExecution> shape.
    // tap() broadcasts every response through latestPage$ so all subscribers
    // (e.g. job-summary) stay in sync without issuing their own HTTP call.
    return this.http.get<Page<JobExecution>>(this.apiUrl, { params }).pipe(
      tap(page => this._latestPage.next(page))
    );
  }

  /**
   * Returns a single job by ID (useful for details view).
   */
  getJobById(id: string): Observable<JobExecution | undefined> {
    return this.http.get<JobExecution>(`${this.apiUrl}/${id}`).pipe(
      map(job => job),
      // Catch errors gracefully and return undefined
    );
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
