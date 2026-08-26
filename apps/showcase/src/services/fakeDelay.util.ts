const FAKE_API_DELAY_MS = Number(import.meta.env.VITE_API_DELAY_MS) || 0;

export const fakeDelay = (): Promise<void> | undefined => {
  if (FAKE_API_DELAY_MS <= 0) return undefined;
  return new Promise((resolve) => {
    setTimeout(resolve, FAKE_API_DELAY_MS);
  });
};
