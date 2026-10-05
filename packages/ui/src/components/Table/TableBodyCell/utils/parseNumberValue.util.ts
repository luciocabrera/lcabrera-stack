export const parseNumberValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value !== 'string') {
    return;
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    return;
  }

  const parsed = Number(trimmed);

  return Number.isNaN(parsed) ? undefined : parsed;
};
