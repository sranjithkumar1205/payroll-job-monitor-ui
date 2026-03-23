/**
 * Represents a paginated response from Spring Data REST endpoints.
 *
 * This interface maps directly to the Spring `Page<T>` JSON structure:
 * {
 *   "content": [...],
 *   "totalElements": 42,
 *   "totalPages": 5,
 *   "number": 0,         <- zero-based current page index
 *   "size": 10,
 *   "first": true,
 *   "last": false,
 *   "empty": false
 * }
 *
 * Used by JobService.getJobs() and consumed by JobTableComponent
 * (pagination signals) and JobSummaryComponent (aggregate counts).
 */
export interface Page<T> {
  /**
   * The actual content items for this page.
   */
  content: T[];

  /**
   * Total number of elements across all pages.
   */
  totalElements: number;

  /**
   * Total number of pages.
   */
  totalPages: number;

  /**
   * Current page number (zero-based index).
   */
  number: number;

  /**
   * Number of items per page (page size).
   */
  size: number;

  /**
   * True if this is the first page.
   */
  first: boolean;

  /**
   * True if this is the last page.
   */
  last: boolean;

  /**
   * True if there are no elements in this page.
   */
  empty: boolean;
}
