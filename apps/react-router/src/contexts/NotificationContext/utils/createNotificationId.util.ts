let fallbackIdCounter = 0;

/**
 * Creates a unique ID for ephemeral notifications.
 * Uses crypto.randomUUID when available and falls back to timestamp+counter.
 */
export const createNotificationId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  fallbackIdCounter += 1;
  return `notification-${Date.now()}-${fallbackIdCounter}`;
};
