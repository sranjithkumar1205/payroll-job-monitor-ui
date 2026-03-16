/**
 * Main dashboard view for the Payroll Job Monitoring application.
 *
 * This component is the landing page for the /dashboard route and houses
 * the summary cards + the job table.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { JobSummaryComponent } from '../job-summary/job-summary.component';
import { JobTableComponent } from '../job-table/job-table.component';

@Component({
  selector: 'app-job-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    JobSummaryComponent,
    JobTableComponent
  ],
  templateUrl: './job-dashboard.component.html',
  styleUrls: ['./job-dashboard.component.scss']
})
export class JobDashboardComponent {
  // Title displayed in the toolbar.
  title = 'Payroll Job Monitoring Dashboard';
}