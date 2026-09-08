type ResolveDeclaredWidthArgs = {
  readonly declared: unknown;
  readonly fallback: number;
};

export const resolveDeclaredWidth = ({
  declared,
  fallback,
}: ResolveDeclaredWidthArgs) => {
  const parsed = Number(declared);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
