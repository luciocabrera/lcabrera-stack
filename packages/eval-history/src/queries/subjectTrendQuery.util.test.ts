import { describe, expect, it } from 'vite-plus/test';

import { subjectTrendQuery } from './subjectTrendQuery.util.ts';

describe('subjectTrendQuery', () => {
  it('reads one subject newest first, with the limit bound last', () => {
    const query = subjectTrendQuery({
      kind: 'skill',
      limit: 30,
      name: 'react-19',
    });

    expect(query.text).toMatch(/from evals\.v_subject_trend/);
    expect(query.text).toMatch(/order by started_at desc\s+limit \$3$/);
    expect(query.values).toEqual(['skill', 'react-19', 30]);
  });
});
