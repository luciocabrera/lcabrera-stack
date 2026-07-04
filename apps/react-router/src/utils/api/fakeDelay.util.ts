/**
 * Simulated API delay in milliseconds for testing loading states.
 * Configurable via VITE_API_DELAY_MS environment variable.
 * Set to 0 for production or to disable delay.
 */
const FAKE_API_DELAY_MS = Number(import.meta.env.VITE_API_DELAY_MS) || 0;

/**
 * Helper to add artificial delay for testing loading states.
 * No-ops when FAKE_API_DELAY_MS is 0 so there is zero overhead in production.
 */
export const fakeDelay = (): Promise<void> | undefined => {
  if (FAKE_API_DELAY_MS <= 0) return undefined;
  return new Promise((resolve) => {
    setTimeout(resolve, FAKE_API_DELAY_MS);
  });
};
