type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  details?: unknown;
  response?: { data?: unknown };
};

export function formatError(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && 'response' in error) {
    const responseData = (error as ErrorPayload).response?.data;
    if (responseData !== undefined) {
      const message = formatError(responseData, '');
      if (message) return message;
    }
  }
  if (error instanceof Error && error.message) return formatError(error.message, fallback);
  if (Array.isArray(error)) {
    const messages = error.map((item) => formatError(item, '')).filter(Boolean);
    return messages.join('; ') || fallback;
  }
  if (error && typeof error === 'object') {
    const payload = error as ErrorPayload;
    for (const value of [payload.message, payload.errors, payload.details, payload.error]) {
      if (value !== undefined && value !== error) {
        const message = formatError(value, '');
        if (message) return message;
      }
    }
    const entries = Object.entries(error)
      .map(([key, value]) => `${key}: ${formatError(value, '')}`)
      .filter((entry) => !entry.endsWith(': '));
    if (entries.length) return entries.join('; ');
  }
  return fallback;
}
