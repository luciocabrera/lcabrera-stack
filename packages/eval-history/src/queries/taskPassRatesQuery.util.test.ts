import { describe, expect, it } from 'vite-plus/test';

import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

describe('taskPassRatesQuery', () => {
  it('reads one run from the pass-rate view, bound as a parameter', () => {
    const query = taskPassRatesQuery({ runId: 'run-a' });

    expect(query.text).toMatch(
      /from evals\.v_task_pass_rate\s+where run_id = \$1/,
    );
    expect(query.values).toEqual(['run-a']);
  });
});
