type GetSparklinePointsArgs = {
  readonly height: number;
  readonly values: readonly number[];
  readonly width: number;
};

export const getSparklinePoints = ({
  height,
  values,
  width,
}: GetSparklinePointsArgs) => {
  if (values.length === 0) return '';

  if (values.length === 1) return `0,${height / 2} ${width},${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y =
        range === 0 ? height / 2 : height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
};
