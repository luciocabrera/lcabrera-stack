import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';

import { judgedDimensionsQuery } from './judgedDimensionsQuery.util.ts';
import { recordGradesQuery } from './recordGradesQuery.util.ts';
import { recordHumanGrades } from './recordHumanGrades.service.ts';

const scriptedClient = (answers: readonly (readonly unknown[])[]) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({ rows: answers[sent.length - 1] ?? [] });
    },
  };

  return { client, sent };
};

const args = {
  grader: 'lucio',
  scores: [{ dimension: 'clarity', score: 4 }],
  trialId: '42',
};

describe('recordHumanGrades', () => {
  it('records scores for dimensions the judge scored', async () => {
    const { client, sent } = scriptedClient([
      [{ name: 'clarity' }, { name: 'completeness' }],
      [{ dimension: 'clarity' }],
    ]);

    expect(await recordHumanGrades({ client, ...args })).toEqual({
      dimensions: ['clarity'],
      kind: 'recorded',
    });
    expect(sent).toEqual([
      judgedDimensionsQuery({ trialId: '42' }),
      recordGradesQuery(args),
    ]);
  });

  it('writes nothing when a score names a dimension the judge did not score', async () => {
    const { client, sent } = scriptedClient([[{ name: 'completeness' }]]);

    expect(await recordHumanGrades({ client, ...args })).toEqual({
      kind: 'rejected',
      problems: ['"clarity" is not a dimension the judge scored completeness'],
    });
    expect(sent).toHaveLength(1);
  });

  it('writes nothing for a trial with no quality judgement', async () => {
    const { client, sent } = scriptedClient([[]]);

    expect(await recordHumanGrades({ client, ...args })).toEqual({
      kind: 'rejected',
      problems: ['trial 42 has no quality judgement to grade'],
    });
    expect(sent).toHaveLength(1);
  });
});
