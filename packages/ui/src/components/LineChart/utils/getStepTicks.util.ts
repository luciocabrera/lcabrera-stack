type GetStepTicksArgs = {
  readonly end: number;
  readonly start: number;
  readonly step: number;
};

export const getStepTicks = ({ end, start, step }: GetStepTicksArgs) => {
  const first = Math.ceil(start / step) * step;

  return Array.from(
    { length: Math.floor((end - first) / step) + 1 },
    (_, index) => new Date(first + index * step),
  );
};
