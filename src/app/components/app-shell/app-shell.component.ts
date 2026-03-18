import { Component, OnInit, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = signal(false);
  sidenavOpen = signal(true);

  constructor() {
    effect(() => {
      if (this.sidenav) {
        this.sidenav.close();
      }
    });
  }

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, '(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.sidenavOpen.set(false);
        } else {
          this.sidenavOpen.set(true);
        }
      });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  toggleSidenav() {
    this.sidenavOpen.update(open => !open);
  }
}
