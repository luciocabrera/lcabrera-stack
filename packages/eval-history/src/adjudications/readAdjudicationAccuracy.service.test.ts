import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { adjudicationAccuracyQuery } from './adjudicationAccuracyQuery.util.ts';
import { readAdjudicationAccuracy } from './readAdjudicationAccuracy.service.ts';

const ROW = {
  correct: 2,
  falseAlarms: 0,
  missedReal: 1,
  model: 'claude-opus-5-5',
  verdicts: 3,
  verifierRole: 'judge',
};

describe('readAdjudicationAccuracy', () => {
  it('returns the rows of the accuracy view', async () => {
    const { client, sent } = recordingClient([ROW]);

    expect(await readAdjudicationAccuracy({ client })).toEqual([ROW]);
    expect(sent).toEqual([adjudicationAccuracyQuery()]);
  });

  it('refuses a row whose role it does not know', async () => {
    const { client } = recordingClient([{ ...ROW, verifierRole: 'reviewer' }]);

    await expect(readAdjudicationAccuracy({ client })).rejects.toThrow(
      expect.objectContaining({ name: 'ZodError' }),
    );
  });
});
