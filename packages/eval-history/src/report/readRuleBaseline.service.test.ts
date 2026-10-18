import { describe, expect, it } from 'vite-plus/test';

import { SELECT_LATEST_BASELINE_SQL } from '../baseline/baseline.constants.ts';
import { recordingClient } from '../queries/recordingClient.util.ts';
import { readRuleBaseline } from './readRuleBaseline.service.ts';

describe('readRuleBaseline', () => {
  it("reads the baseline of the run's suite and model", async () => {
    const { client, sent } = recordingClient([]);

    expect(
      await readRuleBaseline({
        client,
        run: { modelId: 'model-a', suite: 'skills' },
      }),
    ).toEqual({ kind: 'rows', rows: [] });
    expect(sent).toEqual([
      { text: SELECT_LATEST_BASELINE_SQL, values: ['skills', 'model-a'] },
    ]);
  });

  it('finds no rows, without asking, for a run that names no model', async () => {
    const { client, sent } = recordingClient([]);

    expect(
      await readRuleBaseline({
        client,
        run: { modelId: undefined, suite: 'skills' },
      }),
    ).toEqual({ kind: 'rows', rows: [] });
    expect(sent).toEqual([]);
  });

  it('needs no baseline for a suite that records none', async () => {
    const { client, sent } = recordingClient([]);

    expect(
      await readRuleBaseline({
        client,
        run: { modelId: undefined, suite: 'rules-consistency' },
      }),
    ).toEqual({ kind: 'not-required' });
    expect(sent).toEqual([]);
  });
});
