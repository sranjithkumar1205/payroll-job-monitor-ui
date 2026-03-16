/**
 * Application-level provider configuration.
 *
 * This file wires up router support and enables Angular animations needed
 * by Angular Material components (dialogs, ripples, etc.).
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations()
  ]
};
