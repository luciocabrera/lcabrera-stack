export const getChangedPropKeys = (
  currentProps: Record<string, unknown>,
  prevProps: Record<string, unknown>,
): string[] =>
  Object.keys(currentProps).filter(
    (key) => currentProps[key] !== prevProps[key],
  );
