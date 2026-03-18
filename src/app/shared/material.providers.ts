/**
 * Material Design providers for standalone components.
 * 
 * This centralizes all Angular Material module imports for DRY principle
 * and ease of maintenance.
 */
import { Provider } from '@angular/core';

/**
 * Provides commonly used Material components globally.
 * Used in app.config.ts to avoid repetition in component decorators.
 */
export function provideMaterialImports(): Provider[] {
  return [
    // Material modules can be imported directly in component decorators
    // This is a placeholder for future global Material configuration
  ];
}
