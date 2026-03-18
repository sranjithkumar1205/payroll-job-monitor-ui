/**
 * Job History Component
 * 
 * Displays a table of all job executions with MatTable.
 * Shows job name, status, start time, and end time.
 */
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

import { JobExecution } from '../../models/job.model';

@Component({
  selector: 'app-job-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './job-history.component.html',
  styleUrl: './job-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobHistoryComponent {
  executions = input.required<JobExecution[]>();
  displayedColumns: string[] = ['jobName', 'status', 'startTime', 'endTime'];

  getStatusColor(status: string): string {
    switch (status) {
      case 'RUNNING':
        return '#ff9800'; // orange
      case 'COMPLETED':
        return '#4caf50'; // green
      case 'FAILED':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'RUNNING':
        return 'hourglass_empty';
      case 'COMPLETED':
        return 'check_circle';
      case 'FAILED':
        return 'error';
      default:
        return 'help';
    }
  }
}
