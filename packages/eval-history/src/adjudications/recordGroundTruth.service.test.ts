import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';
import type { GroundTruth } from './adjudications.types.ts';

import { caseOutcomeQuery } from './caseOutcomeQuery.util.ts';
import { recordGroundTruth } from './recordGroundTruth.service.ts';
import { recordGroundTruthQuery } from './recordGroundTruthQuery.util.ts';

const answering = (outcomes: readonly string[]) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({
        rows: sent.length === 1 ? outcomes.map((outcome) => ({ outcome })) : [],
      });
    },
  };

  return { client, sent };
};

const truth: GroundTruth = {
  caseId: 'FP-0001',
  note: undefined,
  source: 'lucio',
  truth: 'FALSE_POSITIVE',
};

describe('recordGroundTruth', () => {
  it('records the true answer of a stored case', async () => {
    const { client, sent } = answering(['split']);

    expect(await recordGroundTruth({ client, ...truth })).toEqual({
      kind: 'recorded',
      outcome: 'split',
    });
    expect(sent).toEqual([
      caseOutcomeQuery('FP-0001'),
      recordGroundTruthQuery(truth),
    ]);
  });

  it('records a reopened dismissal', async () => {
    const reopened: GroundTruth = {
      ...truth,
      source: 'reopened',
      truth: 'REAL',
    };
    const { client, sent } = answering(['dismissed']);

    expect(await recordGroundTruth({ client, ...reopened })).toEqual({
      kind: 'recorded',
      outcome: 'dismissed',
    });
    expect(sent.at(-1)).toEqual(recordGroundTruthQuery(reopened));
  });

  it('writes nothing for a case that is not stored', async () => {
    const { client, sent } = answering([]);

    expect(await recordGroundTruth({ client, ...truth })).toEqual({
      kind: 'rejected',
      problems: [
        'case FP-0001 is not stored; ingest its envelope with vp run evals:ingest first',
      ],
    });
    expect(sent).toHaveLength(1);
  });

  it('writes nothing when a case that was not dismissed is reopened', async () => {
    const { client, sent } = answering(['fixed']);

    expect(
      await recordGroundTruth({
        client,
        ...truth,
        source: 'reopened',
        truth: 'REAL',
      }),
    ).toEqual({
      kind: 'rejected',
      problems: [
        'case FP-0001 was fixed, not dismissed: only a dismissal is reopened',
      ],
    });
    expect(sent).toHaveLength(1);
  });
});
