type GetSparklinePointsArgs = {
  readonly height: number;
  readonly values: readonly number[];
  readonly width: number;
};

/**
 * Maps chronological values onto an SVG polyline `points` string, evenly
 * spaced on x and normalized to [0, height] on y (inverted — SVG y grows
 * downward, so the highest value gets the smallest y). Falls back to a
 * flat mid-height line when there's nothing to compare (0-1 values, or
 * every value identical) rather than dividing by zero.
 */
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
