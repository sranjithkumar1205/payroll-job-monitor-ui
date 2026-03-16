/**
 * Service responsible for retrieving job data.
 *
 * Currently uses mock data, but is designed to be replaced with real HTTP
 * API calls in a future iteration.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, startWith, switchMap, map } from 'rxjs';
import { Job } from '../models/job.model';
import { mockJobs } from '../mocks/mock-jobs';

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
}
