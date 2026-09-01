export const detectDataType = (value: unknown) => {
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'string') {
    if (/^[$€£¥₹]/.test(value)) {
      return 'currency';
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
  }
  return 'string';
};
