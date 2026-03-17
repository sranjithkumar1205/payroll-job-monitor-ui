import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Job } from '../../models/job.model';

/**
 * Dialog component used to display full details for a selected job.
 *
 * The job instance is passed in via the MatDialog data injection token.
 */
@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobDetailsComponent {
  /**
   * Job details are injected via MAT_DIALOG_DATA.
   * This makes the component reusable for any job details dialog.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public job: Job) { }

  /**
   * Convert a job status into a Material palette color.
   * Used by the status chip in the details dialog.
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'RUNNING': return 'accent';
      case 'COMPLETED': return 'primary';
      case 'FAILED': return 'warn';
      default: return '';
    }
  }

  /**
   * Converts a duration (milliseconds) into a human-friendly string.
   * If the duration is missing, it returns 'N/A'.
   */
  formatDuration(duration?: number): string {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}