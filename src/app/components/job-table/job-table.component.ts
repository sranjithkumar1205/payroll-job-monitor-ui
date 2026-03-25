/**
 * Table component showing the list of jobs with filtering and details.
 *
 * Includes search + status filter, pagination, and opens a details dialog when a row is selected.
 */
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { JobService } from '../../services/job.service';
import { JobExecution } from '../../models/job.model';
import { Page } from '../../models/page.model';
import { JobDetailsComponent } from '../job-details/job-details.component';
import { APP_CONSTANTS, JobStatus } from '../../models/constants';

@Component({
  selector: 'app-job-table',
  standalone: true,
  imports: [
    CommonModule,
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
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './job-table.component.html',
  styleUrls: ['./job-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobTableComponent implements OnInit {
  // Columns rendered by the Material table in left-to-right order.
  displayedColumns: string[] = ['jobName', 'status', 'startTime', 'endTime', 'message', 'actions'];

  // MatTableDataSource holds the currently visible (post-filter) rows.
  dataSource = new MatTableDataSource<JobExecution>();

  // Reactive form controls for the search box and status dropdown filters.
  // Changes trigger a page-reset so users always see results from page 0.
  searchControl = new FormControl('');
  statusControl = new FormControl('');

  // Populated from APP_CONSTANTS so page-size options stay consistent app-wide.
  statusOptions = APP_CONSTANTS.JOB_STATUS_OPTIONS;
  pageSizeOptions = APP_CONSTANTS.PAGE_SIZE_OPTIONS; // e.g. [5, 10, 25, 50]
  defaultPageSize = APP_CONSTANTS.DEFAULT_PAGE_SIZE; // 10

  // --- Pagination & Sort signals ---
  // All four signals are consumed by the `effect()` in the constructor so that
  // any change to any of them automatically triggers a fresh HTTP request.

  /** Zero-based page index sent to the backend. Updated by MatPaginator events. */
  currentPage = signal(0);

  /**
   * Number of rows per page sent to the backend.
   * Typed as `number` explicitly to prevent TypeScript inferring the literal type
   * `10`, which would cause a TS2345 error when MatPaginator assigns a different
   * page-size value at runtime.
   */
  pageSize = signal<number>(this.defaultPageSize);

  /** Total record count returned by the backend; drives the paginator length. */
  totalElements = signal(0);

  /** Backend field name to sort by. Defaults to most-recent-first ordering. */
  sortBy = signal('startTime');

  /** Sort direction forwarded to the backend query string. */
  sortDir = signal<'asc' | 'desc'>('desc');

  /** Search term sent to the backend as jobName query parameter. */
  searchTerm = signal('');

  /** Selected status sent to the backend as status query parameter. */
  statusFilter = signal('');

  // --- UI state signals ---
  /** True while the HTTP request is in-flight; shows a spinner in the template. */
  isLoading = signal(false);

  /** True when the backend returns zero results; shows the empty-state message. */
  isEmpty = signal(false);

  private jobService = inject(JobService);
  private dialog = inject(MatDialog);

  constructor() {
    /**
     * Reactive effect — Angular signals equivalent of a computed side-effect.
     * Runs once on construction, then re-runs automatically whenever any of
     * the four pagination/sort signals change their value.
     * This keeps UI state and the backend query in sync without manual subscriptions.
     */
    effect(() => {
      this.loadJobs(
        this.currentPage(),
        this.pageSize(),
        this.sortBy(),
        this.sortDir(),
        this.searchTerm(),
        this.statusFilter()
      );
    });
  }

  ngOnInit() {
    /**
     * Filter change listeners — reset to page 0 on every search or status change.
     * `startWith('')` ensures the subscription fires immediately on component init
     * so the initial empty-string value is processed the same way as user input.
     * Resetting `currentPage` to 0 is enough to re-trigger the effect above.
     */
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.searchTerm.set(value?.trim() ?? '');
      this.currentPage.set(0);
    });

    this.statusControl.valueChanges.pipe(
      startWith('')
    ).subscribe((value) => {
      this.statusFilter.set(value ?? '');
      this.currentPage.set(0);
    });
  }

  /**
   * Loads a single page of jobs from the backend via JobService.
   *
   * Called automatically by the constructor `effect()` whenever `currentPage`,
   * `pageSize`, `sortBy`, or `sortDir` signals change.
   *
   * Flow:
   *   1. Set `isLoading` → spinner appears in template.
   *   2. HTTP GET to backend with pagination/sort query params.
   *   3. On success: update `totalElements` (drives paginator length),
   *      apply local client-side filters, populate `dataSource`.
   *   4. On error: hide spinner and show empty-state.
   */
  private loadJobs(
    page: number,
    size: number,
    sortBy: string,
    sortDir: 'asc' | 'desc',
    searchTerm: string,
    status: string
  ): void {
    this.isLoading.set(true);

    this.jobService.getJobs(page, size, sortBy, sortDir, searchTerm, status).subscribe({
      next: (response: Page<JobExecution>) => {
        // `totalElements` is the FULL record count across all pages,
        // not just the count of items on this page.
        this.totalElements.set(response.totalElements);

        // Mark empty when the backend reports 0 records (covers both
        // `response.empty` flag and guard against missing metadata).
        this.isEmpty.set(response.empty || response.totalElements === 0);

        // Backend now applies search/status filtering before pagination.
        this.dataSource.data = response.content;
        this.isLoading.set(false);
      },
      error: (err) => {
        // Log full error for debugging; show empty-state UI instead of crashing.
        console.error('Error loading jobs:', err);
        this.isLoading.set(false);
        this.isEmpty.set(true);
      }
    });
  }

  /**
   * Handles `(page)` events emitted by MatPaginator.
   *
   * MatPaginator emits a `PageEvent` containing the new page index and page size
   * whenever the user clicks a page number, next/prev, or changes the page-size
   * selector.  Updating both signals triggers the reactive `effect()` which
   * automatically calls `loadJobs()` with the new values.
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex); // zero-based page number
    this.pageSize.set(event.pageSize);     // rows per page chosen by the user
  }

  /**
   * Handles sort direction changes from the sort-direction menu.
   *
   * Resets to page 0 first so the user always sees the beginning of the
   * newly sorted result set rather than an arbitrary middle page.
   */
  onSortChange(direction: 'asc' | 'desc'): void {
    this.currentPage.set(0);      // return to first page on re-sort
    this.sortDir.set(direction);  // 'asc' or 'desc' forwarded to backend
  }

  /**
   * Handles sort field changes from the sort-by dropdown.
   *
   * Like `onSortChange`, resets to page 0 to avoid confusing off-page results.
   */
  onSortFieldChange(field: string): void {
    this.currentPage.set(0); // return to first page on field change
    this.sortBy.set(field);  // e.g. 'startTime', 'jobName', 'status'
  }

  /**
   * Maps a job status string to the corresponding Angular Material theme color.
   *
   * Returns one of: 'primary' (completed), 'accent' (running), 'warn' (failed).
   * Falls back to an empty string for unknown statuses so no color is applied.
   */
  getStatusColor(status: string): string {
    return APP_CONSTANTS.STATUS_COLOR_MAP[status as JobStatus] || '';
  }

  /**
   * Opens the Job Details dialog for the selected row.
   *
   * Passes the full `JobExecution` object as dialog data so JobDetailsComponent
   * can render all available execution metadata without an additional HTTP call.
   */
  openDetails(job: JobExecution) {
    this.dialog.open(JobDetailsComponent, {
      data: job,
      width: '500px'
    });
  }
}
