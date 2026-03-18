/**
 * Table component showing the list of jobs with filtering and details.
 *
 * Includes search + status filter, pagination, and opens a details dialog when a row is selected.
 */
import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, inject, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { combineLatest, map, startWith } from 'rxjs';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { JobDetailsComponent } from '../job-details/job-details.component';
import { APP_CONSTANTS, JobStatus } from '../../models/constants';

@Component({
  selector: 'app-job-table',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    ReactiveFormsModule
  ],
  templateUrl: './job-table.component.html',
  styleUrls: ['./job-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobTableComponent implements OnInit, AfterViewInit {
  /**
   * Template reference to the paginator component
   * Allows programmatic control of pagination
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Columns displayed in the Material table
  displayedColumns: string[] = ['jobName', 'status', 'startTime', 'endTime', 'duration', 'actions'];
  dataSource = new MatTableDataSource<Job>();

  // Form controls used for filtering
  searchControl = new FormControl('');
  statusControl = new FormControl('');

  // Use constants for status options and pagination
  statusOptions = APP_CONSTANTS.JOB_STATUS_OPTIONS;
  pageSizeOptions = APP_CONSTANTS.PAGE_SIZE_OPTIONS;
  defaultPageSize = APP_CONSTANTS.DEFAULT_PAGE_SIZE;

  private jobService = inject(JobService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    // Combine the latest values from the job stream and the filter controls
    const jobs$ = this.jobService.getJobs();
    const search$ = this.searchControl.valueChanges.pipe(startWith(''));
    const status$ = this.statusControl.valueChanges.pipe(startWith(''));

    // Whenever any of the inputs change, recalculate the filtered set.
    combineLatest([jobs$, search$, status$]).pipe(
      map(([jobs, search, status]) => {
        let filtered = jobs;

        // Filter by job name (case-insensitive)
        if (search) {
          filtered = filtered.filter(job =>
            job.jobName.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Filter by job status
        if (status) {
          filtered = filtered.filter(job => job.status === status);
        }

        return filtered;
      })
    ).subscribe(filteredJobs => {
      this.dataSource.data = filteredJobs;
    });
  }

  /**
   * Angular lifecycle hook - runs after view initialization
   * Connects the paginator to the data source after the view is fully rendered
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  /**
   * Map a status value to a color that matches the Material theme palette.
   * Uses the constant color mappings from APP_CONSTANTS.
   */
  getStatusColor(status: string): string {
    return APP_CONSTANTS.STATUS_COLOR_MAP[status as JobStatus] || '';
  }

  /**
   * Human-friendly formatting for duration (milliseconds).
   */
  formatDuration(duration?: number): string {
    if (!duration) return '-';
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Opens the Job Details dialog for the selected job.
   */
  openDetails(job: Job) {
    this.dialog.open(JobDetailsComponent, {
      data: job,
      width: '500px'
    });
  }
}
