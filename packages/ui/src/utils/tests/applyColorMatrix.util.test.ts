import { describe, expect, it } from 'vite-plus/test';

import { applyColorMatrix } from './applyColorMatrix.util';

describe('applyColorMatrix', () => {
  it('returns the vector unchanged under the identity matrix', () => {
    expect(
      applyColorMatrix({
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
      applyColorMatrix({
        matrix: [
          [1, 2, 3],
          [0, -1, 0],
        ],
        vector: [1, 2, 3],
      }),
    ).toEqual([14, -2]);
  });
});
