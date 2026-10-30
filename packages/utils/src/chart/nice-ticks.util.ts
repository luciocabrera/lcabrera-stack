import {
  NICE_STEP_MULTIPLE_CEILING,
  NICE_STEP_MULTIPLES,
} from './chart.constants';

type NiceTicksArgs = {
  readonly count: number;
  readonly max: number;
  readonly min: number;
};

export const niceTicks = ({ count, max, min }: NiceTicksArgs) => {
  if (count < 1) return [];

  const low = Math.min(min, max);
  const high = Math.max(min, max);

  if (low === high) return [low];

  const rawStep = (high - low) / count;
  const power = Math.floor(Math.log10(rawStep));
  const normalised = rawStep / 10 ** power;
  const multiple =
    NICE_STEP_MULTIPLES.find(({ below }) => normalised < below)?.multiple ??
    NICE_STEP_MULTIPLE_CEILING;
  const step = multiple * 10 ** power;
  const digits = Math.max(0, -power);
  const tick = (steps: number) => Number((steps * step).toFixed(digits));
  const nearestFirst = Math.round(low / step);
  const nearestLast = Math.round(high / step);
  const first = tick(nearestFirst) < low ? nearestFirst + 1 : nearestFirst;
  const last = tick(nearestLast) > high ? nearestLast - 1 : nearestLast;

  return Array.from({ length: last - first + 1 }, (_, offset) =>
    tick(first + offset),
  );
};
