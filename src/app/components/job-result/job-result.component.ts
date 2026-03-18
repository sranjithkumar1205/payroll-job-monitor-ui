/**
 * Job Result Component
 * 
 * Displays the result of a job execution including status, timestamps,
 * and execution message.
 */
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

import { JobExecution } from '../../models/job.model';
import { APP_CONSTANTS, JobExecutionStatus } from '../../models/constants';

@Component({
  selector: 'app-job-result',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './job-result.component.html',
  styleUrl: './job-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobResultComponent {
  execution = input.required<JobExecution>();

  getStatusColor(): string {
    const status = this.execution().status;
    switch (status) {
      case JobExecutionStatus.RUNNING:
        return '#ff9800'; // orange
      case JobExecutionStatus.COMPLETED:
        return '#4caf50'; // green
      case JobExecutionStatus.FAILED:
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  }

  getStatusIcon(): string {
    const status = this.execution().status;
    switch (status) {
      case JobExecutionStatus.RUNNING:
        return 'hourglass_empty';
      case JobExecutionStatus.COMPLETED:
        return 'check_circle';
      case JobExecutionStatus.FAILED:
        return 'error';
      default:
        return 'help';
    }
  }
}
