/** A synchronous throw becomes a rejection rather than escaping the caller (ADR-094 §6c). */
export const startInjectedResolver = <TValue>(
  start: () => Promise<TValue> | TValue,
) => {
  try {
    return Promise.resolve(start());
  } catch (error) {
    return Promise.reject(error);
  }
};
