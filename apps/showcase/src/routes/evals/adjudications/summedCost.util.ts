export const summedCost = (costs: readonly (number | undefined)[]) => {
  const reported = costs.filter((cost) => cost !== undefined);

  return reported.length === 0
    ? undefined
    : reported.reduce((total, cost) => total + cost, 0);
};
