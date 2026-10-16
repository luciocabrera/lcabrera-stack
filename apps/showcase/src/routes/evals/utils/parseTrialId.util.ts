const DIGITS = /^\d+$/u;

const MAX_BIGINT = 9_223_372_036_854_775_807n;

export const parseTrialId = (value: null | string) => {
  if (value === null || !DIGITS.test(value)) {
    return;
  }

  const id = BigInt(value);

  return id >= 1n && id <= MAX_BIGINT ? id.toString() : undefined;
};
