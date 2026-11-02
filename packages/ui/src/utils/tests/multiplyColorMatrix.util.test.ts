import { describe, expect, it } from 'vite-plus/test';

import { multiplyColorMatrix } from './multiplyColorMatrix.util';

describe('multiplyColorMatrix', () => {
  it('returns the vector unchanged for the identity matrix', () => {
    expect(
      multiplyColorMatrix({
        matrix: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        vector: [0.2, 0.4, 0.6],
      }),
    ).toEqual([0.2, 0.4, 0.6]);
  });

  it('takes the dot product of each row with the vector', () => {
    expect(
      multiplyColorMatrix({
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        vector: [1, 10, 100],
      }),
    ).toEqual([321, 654, 987]);
  });
});
