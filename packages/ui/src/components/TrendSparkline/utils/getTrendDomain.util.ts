type GetTrendDomainArgs = {
  readonly bottom: number;
  readonly isFlatOnBaseline: boolean;
  readonly top: number;
};

export const getTrendDomain = ({
  bottom,
  isFlatOnBaseline,
  top,
}: GetTrendDomainArgs) => {
  return top > bottom || (top === bottom && !isFlatOnBaseline)
    ? ([bottom, top] as const)
    : ([bottom, bottom + 1] as const);
};
