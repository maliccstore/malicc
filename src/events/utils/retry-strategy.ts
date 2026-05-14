/**
 * Calculates exponential backoff delay in milliseconds.
 * Strategy:
 * Attempt 1: 30 sec
 * Attempt 2: 5 min
 * Attempt 3: 1 hour
 * Attempt 4: 6 hours
 * Attempt 5: Max Retry
 */
export function getRetryDelay(retryCount: number): number {
  const delays = [
    30 * 1000,          // 30 sec
    5 * 60 * 1000,      // 5 min
    60 * 60 * 1000,     // 1 hour
    6 * 60 * 60 * 1000, // 6 hours
  ];

  if (retryCount >= delays.length) {
    return -1; // Indicate max retries reached
  }

  // Add a small jitter (±10%) to prevent thundering herd
  const baseDelay = delays[retryCount];
  const jitter = baseDelay * 0.1 * (Math.random() * 2 - 1);
  
  return Math.floor(baseDelay + jitter);
}

export const MAX_RETRIES = 5;
