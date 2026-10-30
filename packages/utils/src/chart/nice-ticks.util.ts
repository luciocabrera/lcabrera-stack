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
  const low = Math.min(min, max);
  const high = Math.max(min, max);

  if (low === high) return [low];

  if (count < 1) return [];

  const rawStep = (high - low) / count;
  const power = Math.floor(Math.log10(rawStep));
  const normalised = rawStep / 10 ** power;
  const multiple =
    NICE_STEP_MULTIPLES.find(({ below }) => normalised < below)?.multiple ??
    NICE_STEP_MULTIPLE_CEILING;
  const step = multiple * 10 ** power;
  const first = Math.ceil(low / step);
  const last = Math.floor(high / step);
  const digits = Math.max(0, -power);

  return Array.from({ length: last - first + 1 }, (_, offset) =>
    Number(((first + offset) * step).toFixed(digits)),
  );
};
