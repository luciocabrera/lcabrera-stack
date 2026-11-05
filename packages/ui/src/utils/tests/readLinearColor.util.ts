import { labToLinearSrgb } from './labToLinearSrgb.util';
import { oklchToLinearSrgb } from './oklchToLinearSrgb.util';

export const readLinearColor = (value: string) => {
  if (value.startsWith('oklch(')) return oklchToLinearSrgb(value);
  if (value.startsWith('lab(')) return labToLinearSrgb(value);

  throw new Error(`Unsupported colour value ${value}`);
};
