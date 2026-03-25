/**
 * Summary cards component displaying counts for job statuses.
 *
 * Uses the JobService observable stream and derives counts using RxJS mapping.
 */
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map, filter, shareReplay } from 'rxjs';
import { JobService } from '../../services/job.service';
import { JobExecution } from '../../models/job.model';
import { Page } from '../../models/page.model';

@Component({
  selector: 'app-job-summary',
  standalone: true,
  imports: [
    AsyncPipe,
    MatCardModule,
    MatIconModule],
  templateUrl: './job-summary.component.html',
  styleUrls: ['./job-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobSummaryComponent implements OnInit {
  totalJobs$!: Observable<number>;
  runningJobs$!: Observable<number>;
  completedJobs$!: Observable<number>;
  failedJobs$!: Observable<number>;

  private jobService = inject(JobService);

  ngOnInit() {
    /**
     * Subscribe to the shared broadcast stream from JobService instead of
     * calling getJobs() directly. This means job-summary never fires its own
     * HTTP request — it reacts to the same response that job-table already
     * fetched, eliminating duplicate API calls entirely.
     *
     * shareReplay(1) ensures all four derived Observables below share a single
     * subscription to the upstream BehaviorSubject, preventing the async pipe
     * from creating four independent subscriptions (which would otherwise each
     * trigger the upstream cold Observable four times).
     */
    const jobs$ = this.jobService.latestPage$.pipe(
      filter((page): page is Page<JobExecution> => page !== null),
      shareReplay(1)
    );

    // `totalElements` comes from the Spring Page metadata — it reflects the
    // TOTAL record count in the database, not just the count on this page.
    this.totalJobs$ = jobs$.pipe(
      map((page: Page<JobExecution>) => page.totalElements)
    );

    // Count RUNNING jobs from the current page's `content` array.
    this.runningJobs$ = jobs$.pipe(
      map((page: Page<JobExecution>) =>
        page.content.filter((job: JobExecution) => job.status === 'RUNNING').length
      )
    );

    // Count COMPLETED jobs from the current page's `content` array.
    this.completedJobs$ = jobs$.pipe(
      map((page: Page<JobExecution>) =>
        page.content.filter((job: JobExecution) => job.status === 'COMPLETED').length
      )
    );

    // Count FAILED jobs from the current page's `content` array.
    this.failedJobs$ = jobs$.pipe(
      map((page: Page<JobExecution>) =>
        page.content.filter((job: JobExecution) => job.status === 'FAILED').length
      )
    );
  }
}