const createFallbackIdGenerator = () => {
  let fallbackIdCounter = 0;

  return (): string => {
    fallbackIdCounter += 1;
    return `notification-${Date.now()}-${fallbackIdCounter}`;
  };
};

const generateFallbackId = createFallbackIdGenerator();

/**
 * Creates a unique ID for ephemeral notifications.
 * Uses crypto.randomUUID when available and falls back to timestamp+counter.
 */
export const createNotificationId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return generateFallbackId();
};
