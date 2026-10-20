import { describe, expect, it } from 'vite-plus/test';

import { readQualityBaselines } from './readQualityBaselines.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_baseline: [
    'baseline_id',
    'computed_at',
    'id',
    'metric',
    'model_id',
    'subject_id',
    'suite',
  ],
  eval_run: ['baseline_id', 'run_id', 'started_at', 'suite'],
  eval_subject: ['id', 'kind', 'name'],
});

const ROW = {
  baselineId: '00000000-0000-4000-8000-0000000000ff',
  modelId: 'model-a',
  runIds: ['00000000-0000-4000-8000-000000000001'],
  subjectKind: 'skill',
  subjectName: 'react-19',
};

describe('readQualityBaselines', () => {
  it('reads the latest quality baseline per skill', async () => {
    const { client } = scriptedClient({
      answer: () => [ROW],
      columns: COLUMNS,
    });

    expect(await readQualityBaselines({ client })).toEqual([ROW]);
  });

  it('rejects a run id that is no uuid', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...ROW, runIds: ['run'] }],
      columns: COLUMNS,
    });

    await expect(readQualityBaselines({ client })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'runIds', 0] })],
      }),
    );
  });
});
