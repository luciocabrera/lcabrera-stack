import type { ColorMatrix, Rgb } from './tests.types';

type MultiplyColorMatrixArgs = {
  readonly matrix: ColorMatrix;
  readonly vector: Rgb;
};

export const multiplyColorMatrix = ({
  matrix,
  vector,
}: MultiplyColorMatrixArgs) => {
  const dot = ([first, second, third]: Rgb) =>
    first * vector[0] + second * vector[1] + third * vector[2];

  return [dot(matrix[0]), dot(matrix[1]), dot(matrix[2])] as const;
};
