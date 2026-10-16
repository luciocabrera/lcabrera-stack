export const heatTone = (rate: number | undefined) => {
  if (rate === undefined) {
    return 'none' as const;
  }

  if (rate >= 0.9) {
    return 'high' as const;
  }

  return rate >= 0.5 ? ('mid' as const) : ('low' as const);
};
