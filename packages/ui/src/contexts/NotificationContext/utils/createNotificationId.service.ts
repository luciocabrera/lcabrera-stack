const createFallbackIdGenerator = () => {
  let fallbackIdCounter = 0;

  return () => {
    fallbackIdCounter += 1;
    return `notification-${Date.now()}-${fallbackIdCounter}`;
  };
};

const generateFallbackId = createFallbackIdGenerator();

export const createNotificationId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return generateFallbackId();
};
