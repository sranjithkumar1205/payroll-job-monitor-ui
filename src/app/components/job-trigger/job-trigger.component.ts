/**
 * Job Trigger Component
 * 
 * Main component for manually triggering batch jobs.
 * Provides a form to select a job, optionally upload a file,
 * and execute the job immediately.
 */
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

import { JobService } from '../../services/job.service';
import { JobResultComponent } from '../job-result/job-result.component';
import { JobHistoryComponent } from '../job-history/job-history.component';
import { JobExecution } from '../../models/job.model';

// Import constants and enums for type-safe status values and app configuration
import { APP_CONSTANTS, JobExecutionStatus } from '../../models/constants';

interface JobTemplate {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-job-trigger',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    JobResultComponent,
    JobHistoryComponent
  ],
  templateUrl: './job-trigger.component.html',
  styleUrl: './job-trigger.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobTriggerComponent {
  form!: FormGroup;
  jobTemplates = signal<JobTemplate[]>([]);
  selectedFileName = signal<string | null>(null);
  isExecuting = signal(false);
  lastExecution = signal<JobExecution | null>(null);
  executionHistory = signal<JobExecution[]>([]);

  private fileInput: HTMLInputElement | null = null;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService
  ) {
    this.initializeForm();
    this.loadJobTemplates();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      jobName: ['', Validators.required],
      filePath: ['']
    });
  }

  private loadJobTemplates(): void {
    this.jobService.getJobTemplates().subscribe(templates => {
      this.jobTemplates.set(templates);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName.set(input.files[0].name);
    }
  }

  triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.addEventListener('change', (e) => this.onFileSelected(e));
    }
    this.fileInput.click();
  }

  runJob(): void {
    if (this.form.invalid) {
      return;
    }

    const jobName = this.form.get('jobName')?.value;
    const file = this.fileInput?.files?.[0];

    this.isExecuting.set(true);
    this.form.disable();

    this.jobService.triggerJob(jobName, file).subscribe({
      next: (execution) => {
        this.lastExecution.set(execution);
        console.log('execution', execution)
        // Use JobExecutionStatus enum for type-safe status comparison instead of hardcoded strings
        if (execution.status === JobExecutionStatus.COMPLETED || execution.status === JobExecutionStatus.FAILED) {
          const history = this.executionHistory();
          history.unshift(execution);
          this.executionHistory.set([...history]);
        }
      },
      error: (error) => {
        console.error('Job execution failed:', error);
        this.isExecuting.set(false);
        this.form.enable();
      },
      complete: () => {
        this.isExecuting.set(false);
        this.form.enable();
      }
    });
  }

  clearForm(): void {
    this.form.reset();
    this.selectedFileName.set(null);
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.lastExecution.set(null);
  }
}
