export const safeJsonParse = (raw: null | string): unknown => {
  if (raw === null || raw === '') {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
