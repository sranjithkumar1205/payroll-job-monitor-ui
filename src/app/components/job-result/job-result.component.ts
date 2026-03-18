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

  getStatusIcon(): string {
    const status = this.execution().status;
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
