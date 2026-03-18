/**
 * Application routing configuration.
 *
 * The trigger dashboard is the default route for the app.
 */
import { Routes } from '@angular/router';
import { JobDashboardComponent } from './components/job-dashboard/job-dashboard.component';
import { JobTriggerComponent } from './components/job-trigger/job-trigger.component';

export const routes: Routes = [
  { path: '', redirectTo: '/trigger', pathMatch: 'full' },
  { path: 'trigger', component: JobTriggerComponent },
  { path: 'dashboard', component: JobDashboardComponent }
];
