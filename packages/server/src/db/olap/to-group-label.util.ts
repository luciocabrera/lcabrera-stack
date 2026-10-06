const EMPTY_GROUP_LABEL = '(empty)';

export const toGroupLabel = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return value instanceof Date ? value.toISOString() : EMPTY_GROUP_LABEL;
};
