import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreementQuery } from '../grades/judgeAgreementQuery.util.ts';
import { recordingClient } from '../queries/recordingClient.util.ts';
import { readReportAgreement } from './readReportAgreement.service.ts';

const thresholds = { minTrialsForRate: 2, z: 1.96 };

const row = {
  humanScore: 4,
  judgeModel: 'claude-opus-5-5',
  judgePromptHash: 'a'.repeat(64),
  judgeScore: 4,
};

describe('readReportAgreement', () => {
  it('says agreement needs the database when there is no client', async () => {
    expect(
      await readReportAgreement({ client: undefined, thresholds }),
    ).toEqual({ kind: 'needs-database' });
  });

  it('reads the hand grades and groups them per judge at the thresholds', async () => {
    const { client, sent } = recordingClient([row, { ...row, humanScore: 2 }]);

    expect(await readReportAgreement({ client, thresholds })).toEqual({
      judges: [
        {
          agreement: expect.objectContaining({ k: 1, kind: 'rate', n: 2 }),
          judgeModel: row.judgeModel,
          judgePromptHash: row.judgePromptHash,
          meanGap: 1,
        },
      ],
      kind: 'read',
    });
    expect(sent).toEqual([judgeAgreementQuery()]);
  });
});
