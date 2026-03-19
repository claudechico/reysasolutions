/**
 * Extracts a user-friendly error message from various error formats
 * Prioritizes user-friendly messages from backend over technical error codes
 */
export function getFriendlyErrorMessage(error: any, fallbackMessage: string = 'An error occurred. Please try again.'): string {
  // If error is already a string and looks friendly (not a status code), return it
  if (typeof error === 'string') {
    // Skip technical messages like "400", "401", "404", "500", etc.
    if (/^\d{3}$/.test(error.trim())) {
      return fallbackMessage;
    }
    // Skip JSON strings that look technical
    if (error.trim().startsWith('{') || error.trim().startsWith('[')) {
      return fallbackMessage;
    }
    return error;
  }

  // Handle error objects with body property (from API requests)
  if (error?.body) {
    const body = error.body;
    
    // Prefer message field (usually more user-friendly)
    if (body?.message && typeof body.message === 'string') {
      return body.message;
    }
    
    // Fall back to error field if message is not available
    if (body?.error && typeof body.error === 'string') {
      // Check if it's a technical error code
      if (!/^\d{3}$/.test(body.error.trim())) {
        return body.error;
      }
    }
  }

  // Handle error objects with message property
  if (error?.message && typeof error.message === 'string') {
    // Skip status codes
    if (/^\d{3}$/.test(error.message.trim())) {
      return fallbackMessage;
    }
    // Skip JSON strings
    if (error.message.trim().startsWith('{') || error.message.trim().startsWith('[')) {
      return fallbackMessage;
    }
    return error.message;
  }

  // Handle error objects with error property
  if (error?.error && typeof error.error === 'string') {
    if (!/^\d{3}$/.test(error.error.trim())) {
      return error.error;
    }
  }

  // Handle status codes with friendly messages
  if (error?.status) {
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'Authentication required. Please log in and try again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This resource already exists. Please check and try again.',
      422: 'Validation failed. Please check your input and try again.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };
    
    if (statusMessages[error.status]) {
      return statusMessages[error.status];
    }
  }

  // Default fallback
  return fallbackMessage;
}

