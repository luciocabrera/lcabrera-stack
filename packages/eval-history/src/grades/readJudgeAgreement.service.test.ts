import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { judgeAgreementQuery } from './judgeAgreementQuery.util.ts';
import { readJudgeAgreement } from './readJudgeAgreement.service.ts';

const row = {
  humanScore: 4,
  judgeModel: 'claude-opus-5-5',
  judgePromptHash: 'a'.repeat(64),
  judgeScore: 3,
};

describe('readJudgeAgreement', () => {
  it('sends the agreement query and returns the typed rows', async () => {
    const { client, sent } = recordingClient([row]);

    expect(await readJudgeAgreement({ client })).toEqual([row]);
    expect(sent).toEqual([judgeAgreementQuery()]);
  });

  it('rejects a row whose hand grade is not a whole number', async () => {
    const { client } = recordingClient([{ ...row, humanScore: 3.5 }]);

    await expect(readJudgeAgreement({ client })).rejects.toThrow();
  });
});
