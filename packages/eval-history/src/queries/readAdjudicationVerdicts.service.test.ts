import { describe, expect, it } from 'vite-plus/test';

import { readAdjudicationVerdicts } from './readAdjudicationVerdicts.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  adjudication_verdict: [
    'agent_prompt_hash',
    'case_id',
    'cost_usd',
    'duration_ms',
    'model',
    'tokens_in',
    'tokens_out',
    'verdict',
    'verifier_role',
  ],
});

const HASH = 'a'.repeat(64);

const UNPRICED: Record<string, unknown> = JSON.parse(
  `{"agentPromptHash": "${HASH}", "caseId": "FP-0001", "costUsd": null, "durationMs": 22100, "model": "gemini-4-pro", "role": "adversary", "tokensIn": 13050, "tokensOut": 940, "verdict": "REAL"}`,
);

describe('readAdjudicationVerdicts', () => {
  it('reads each verdict, an unreported cost as absent', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...UNPRICED, costUsd: 0.04, role: 'judge' }, UNPRICED],
      columns: COLUMNS,
    });

    expect(await readAdjudicationVerdicts({ client })).toEqual([
      {
        agentPromptHash: HASH,
        caseId: 'FP-0001',
        costUsd: 0.04,
        durationMs: 22_100,
        model: 'gemini-4-pro',
        role: 'judge',
        tokensIn: 13_050,
        tokensOut: 940,
        verdict: 'REAL',
      },
      {
        agentPromptHash: HASH,
        caseId: 'FP-0001',
        costUsd: undefined,
        durationMs: 22_100,
        model: 'gemini-4-pro',
        role: 'adversary',
        tokensIn: 13_050,
        tokensOut: 940,
        verdict: 'REAL',
      },
    ]);
  });

  it('rejects a verdict that is neither REAL nor FALSE_POSITIVE', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...UNPRICED, verdict: 'UNSURE' }],
      columns: COLUMNS,
    });

    await expect(readAdjudicationVerdicts({ client })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'verdict'] })],
      }),
    );
  });
});
