/**
 * Utility to map low-level database or validation errors to user-friendly messages.
 */
interface PostgresError {
  code?: string;
  message?: string;
  detail?: string;
}

export function mapPostgresError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  // Handle Supabase/Postgres error objects
  const pgError = error as PostgresError;
  const code = pgError.code;
  const message = pgError.message || '';

  // 23505: Unique violation
  if (code === '23505') {
    if (message.includes('slug')) return 'An event with this title already exists. Please try a different title.';
    return 'A record with this information already exists.';
  }

  // 23503: Foreign key violation
  if (code === '23503') {
    return 'One of the selected options (category, venue, etc.) is invalid or no longer exists.';
  }

  // 23502: Not null violation
  if (code === '23502') {
    const field = message.match(/column "(.*)"/)?.[1] || 'required field';
    return `The ${field.replace(/_/g, ' ')} is required.`;
  }

  // 23P01: Check constraint violation
  if (code === '23P01') {
    if (message.includes('end_after_start')) return 'The end date must be after the start date.';
    if (message.includes('positive_price')) return 'Price cannot be negative.';
    return 'The provided information does not meet the requirements.';
  }

  // 42P01: Undefined table (shouldn't happen in prod, but for safety)
  if (code === '42P01') {
    return 'System configuration error: Table not found.';
  }

  // Generic patterns
  if (message.includes('JWT')) return 'Your session has expired. Please log in again.';
  if (message.includes('Unauthorized')) return 'You do not have permission to perform this action.';

  // Fallback to simpler message if it's already somewhat readable
  if (message && message.length < 100 && !message.includes('schema') && !message.includes('violates')) {
    return message;
  }

  return 'Failed to save event. Please check your inputs and try again.';
}
