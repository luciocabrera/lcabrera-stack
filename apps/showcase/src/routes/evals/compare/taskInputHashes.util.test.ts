import { describe, expect, it } from 'vite-plus/test';

import { comparisonRow } from './comparisonRow.fixtures';
import { taskInputHashes } from './taskInputHashes.util';

describe('taskInputHashes', () => {
  it('names each input of a task and its subject on one side', () => {
    const hashes = taskInputHashes({
      rows: [comparisonRow({ contentHashB: 'b'.repeat(64), taskKey: 't' })],
      side: 'B',
    });

    expect(hashes).toMatchObject({
      'skill react-19 content': 'b'.repeat(64),
      't agent prompt': undefined,
      't task': 'a'.repeat(64),
    });
  });

  it('leaves out a task that ran on only one side', () => {
    expect(
      taskInputHashes({
        rows: [comparisonRow({ kA: undefined, nA: undefined })],
        side: 'B',
      }),
    ).toEqual({});
  });
});
