type ApplyColorMatrixArgs = {
  readonly matrix: readonly (readonly [number, number, number])[];
  readonly vector: readonly [number, number, number];
};

export const applyColorMatrix = ({ matrix, vector }: ApplyColorMatrixArgs) => {
  const [x, y, z] = vector;

  return matrix.map(([a, b, c]) => a * x + b * y + c * z);
};
