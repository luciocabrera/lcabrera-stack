import { describe, expect, it } from 'vite-plus/test';

import { readAdjudicationCases } from './readAdjudicationCases.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  adjudication_case: [
    'analyzer',
    'builder_model',
    'case_id',
    'created_at',
    'outcome',
    'pr',
    'rule',
  ],
  adjudication_ground_truth: [
    'case_id',
    'id',
    'recorded_at',
    'source',
    'truth',
  ],
});

const OPENED = new Date('2026-11-08T19:06:12.391Z');

const UNANSWERED: Record<string, unknown> = JSON.parse(
  '{"analyzer": "fallow", "builderModel": null, "caseId": "FP-0002", "outcome": "split", "pr": null, "rule": "complexity", "truth": null, "truthSource": null}',
);

describe('readAdjudicationCases', () => {
  it('reads each case, a missing builder, PR or true answer as absent', async () => {
    const { client } = scriptedClient({
      answer: () => [
        {
          analyzer: 'biome',
          builderModel: 'claude-opus-5-5',
          caseId: 'FP-0001',
          createdAt: OPENED,
          outcome: 'dismissed',
          pr: 1594,
          rule: 'lint/a11y/noNoninteractiveElementToInteractiveRole',
          truth: 'REAL',
          truthSource: 'reopened',
        },
        { ...UNANSWERED, createdAt: OPENED },
      ],
      columns: COLUMNS,
    });

    expect(await readAdjudicationCases({ client })).toEqual([
      {
        analyzer: 'biome',
        builderModel: 'claude-opus-5-5',
        caseId: 'FP-0001',
        createdAt: OPENED,
        outcome: 'dismissed',
        pr: 1594,
        rule: 'lint/a11y/noNoninteractiveElementToInteractiveRole',
        truth: 'REAL',
        truthSource: 'reopened',
      },
      {
        analyzer: 'fallow',
        builderModel: undefined,
        caseId: 'FP-0002',
        createdAt: OPENED,
        outcome: 'split',
        pr: undefined,
        rule: 'complexity',
        truth: undefined,
        truthSource: undefined,
      },
    ]);
  });

  it('rejects a pull request number below 1', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...UNANSWERED, createdAt: OPENED, pr: 0 }],
      columns: COLUMNS,
    });

    await expect(readAdjudicationCases({ client })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'pr'] })],
      }),
    );
  });

  it('rejects an outcome the panel never gives', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...UNANSWERED, createdAt: OPENED, outcome: 'pending' }],
      columns: COLUMNS,
    });

    await expect(readAdjudicationCases({ client })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'outcome'] })],
      }),
    );
  });
});
