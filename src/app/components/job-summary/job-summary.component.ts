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
import { Job } from '../../models/job.model';

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
    const jobs$ = this.jobService.getJobs();

    // Derive summary metrics from the job list stream
    this.totalJobs$ = jobs$.pipe(map(jobs => jobs.length));
    this.runningJobs$ = jobs$.pipe(map(jobs => jobs.filter(job => job.status === 'RUNNING').length));
    this.completedJobs$ = jobs$.pipe(map(jobs => jobs.filter(job => job.status === 'COMPLETED').length));
    this.failedJobs$ = jobs$.pipe(map(jobs => jobs.filter(job => job.status === 'FAILED').length));
  }
}