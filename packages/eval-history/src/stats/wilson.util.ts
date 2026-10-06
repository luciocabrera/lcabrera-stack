type WilsonArgs = {
  readonly k: number;
  readonly minN: number;
  readonly n: number;
  readonly z: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const wilson = ({ k, minN, n, z }: WilsonArgs) => {
  if (!Number.isSafeInteger(k) || !Number.isSafeInteger(n) || k < 0 || k > n) {
    throw new RangeError(
      `wilson needs integers 0 <= k <= n, got k=${k}, n=${n}`,
    );
  }

  if (n === 0 || n < minN) {
    return { k, kind: 'insufficient', n } as const;
  }

  const p = k / n;
  const zSquared = z * z;
  const denominator = 1 + zSquared / n;
  const center = (p + zSquared / (2 * n)) / denominator;
  const half =
    (z * Math.sqrt((p * (1 - p)) / n + zSquared / (4 * n * n))) / denominator;

  return {
    k,
    kind: 'rate',
    lower: clamp(center - half),
    n,
    rate: p,
    upper: clamp(center + half),
  } as const;
};
