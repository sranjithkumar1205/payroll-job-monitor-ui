/**
 * Application routing configuration.
 *
 * The dashboard is the default route for the app.
 */
import { Routes } from '@angular/router';
import { JobDashboardComponent } from './components/job-dashboard/job-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: JobDashboardComponent }
];
