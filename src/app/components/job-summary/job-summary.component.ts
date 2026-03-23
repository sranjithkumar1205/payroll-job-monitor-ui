/**
 * Summary cards component displaying counts for job statuses.
 *
 * Uses the JobService observable stream and derives counts using RxJS mapping.
 */
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map } from 'rxjs';
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
     * Fetch the first page of jobs using default parameters (page=0, size=10).
     * The summary cards only need aggregate counts, so one page is sufficient
     * for a quick at-a-glance overview.  The stream is shared across all four
     * derived Observables below via the single `jobs$` reference.
     */
    const jobs$ = this.jobService.getJobs();

    // `totalElements` comes from the Spring Page metadata — it reflects the
    // TOTAL record count in the database, not just the count on this page.
    this.totalJobs$ = jobs$.pipe(
      map((page: Page<JobExecution>) => page.totalElements)
    );

    // Count RUNNING jobs from the current page's `content` array.
    // Note: these counts reflect only the jobs returned on the first page;
    // adjust the page size or add a dedicated summary endpoint for full accuracy.
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