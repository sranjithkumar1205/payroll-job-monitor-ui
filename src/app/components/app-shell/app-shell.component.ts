// Core Angular imports
import { Component, OnInit, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { inject, signal } from '@angular/core';
import { filter } from 'rxjs/operators';

// Angular Material imports for sidenav, toolbar, and navigation
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

// Angular CDK (Component Dev Kit) - provides responsive breakpoint detection
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Application constants
import { APP_CONSTANTS } from '../../models/constants';

/**
 * AppShellComponent - Main layout shell for the entire application
 * Provides responsive sidenav navigation that adapts to screen size
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit {
  /**
   * Template reference to the MatSidenav component
   * Allows programmatic control (open/close) of the sidebar
   */
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  /**
   * Service to navigate between routes
   * Used when user clicks navigation items
   */
  private router = inject(Router);

  /**
   * Service to detect screen size breakpoints
   * Detects when screen size changes to show/hide sidenav
   */
  private breakpointObserver = inject(BreakpointObserver);

  /**
   * Tracks whether the device is mobile (screen width < 768px)
   * Signal: reactive state that updates automatically
   */
  isMobile = signal(false);

  /**
   * Controls whether sidenav is open or closed
   * Starts as true (open) on desktop, false (closed) on mobile
   */
  sidenavOpen = signal(true);

  /**
   * Dynamically displays the current page title based on active route
   * Updates automatically when navigation occurs
   */
  pageTitle = signal<string>(APP_CONSTANTS.DEFAULT_PAGE_TITLE);

  /**
   * Constructor - runs effect to monitor sidenav state changes
   * Uses Angular's effect() for side effects on signal changes
   */
  constructor() {
    // React automatically when isMobile signal changes
    effect(() => {
      // Auto-close sidenav when switching to mobile mode
      if (this.isMobile() && this.sidenav) {
        this.sidenav.close();
      }
    });
  }

  /**
   * Angular lifecycle hook - runs after component initializes
   * Sets up breakpoint observer to detect screen size changes
   */
  ngOnInit() {
    // Start observing screen size breakpoints
    // Handset = default Material breakpoint for mobile
    // max-width: 768px = custom breakpoint for tablet threshold
    this.breakpointObserver
      .observe([Breakpoints.Handset, '(max-width: 768px)'])
      .subscribe(result => {
        // result.matches = true if screen is mobile size
        this.isMobile.set(result.matches);

        // Automatically open/close sidenav based on screen size
        if (result.matches) {
          // Mobile: start with sidenav closed
          this.sidenavOpen.set(false);
        } else {
          // Desktop: start with sidenav open
          this.sidenavOpen.set(true);
        }
      });

    // Subscribe to router navigation events to update page title
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.url;
        if (url.includes('/trigger')) {
          this.pageTitle.set('Job Execution Form');
        } else if (url.includes('/dashboard')) {
          this.pageTitle.set('Dashboard');
        } else {
          this.pageTitle.set(APP_CONSTANTS.DEFAULT_PAGE_TITLE);
        }
      });
  }

  /**
   * Programmatic navigation to a specific route
   * Automatically closes sidenav after navigation on mobile
   * @param route - The target route (e.g., '/trigger', '/dashboard')
   */
  navigateTo(route: string) {
    // Navigate to the selected route
    this.router.navigate([route]);

    // Close sidenav after navigation (better UX on mobile)
    // Sidenav can still be open on desktop for continuous navigation
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  /**
   * Toggle sidenav open/closed state
   * Called when user clicks the menu button in the toolbar
   */
  toggleSidenav() {
    // Update signal: true -> false, false -> true
    // Uses functional update for reactive signal changes
    this.sidenavOpen.update(open => !open);
  }
}
