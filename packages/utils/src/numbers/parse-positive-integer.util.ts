type ParsePositiveIntegerArgs = {
  readonly fallback: number;
  readonly value: string | undefined;
};

export const parsePositiveInteger = ({
  fallback,
  value,
}: ParsePositiveIntegerArgs) => {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
};
