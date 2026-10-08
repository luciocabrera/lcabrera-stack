import { describe, expect, it } from 'vite-plus/test';

import { viewDependencyViolations } from './viewDependencyViolations.util.ts';

describe('viewDependencyViolations', () => {
  it('allows base tables and registered reporting relations', () => {
    expect(
      viewDependencyViolations({
        allowed: ['v_subject_trend'],
        dependencies: [
          { kind: 'r', relation: 'eval_trial' },
          { kind: 'v', relation: 'v_subject_trend' },
        ],
      }),
    ).toEqual([]);
  });

  it('names any other view, materialised view or function it depends on', () => {
    expect(
      viewDependencyViolations({
        allowed: [],
        dependencies: [
          { kind: 'v', relation: 'v_probe_helper' },
          { kind: 'f', relation: 'helper_fn' },
        ],
      }),
    ).toEqual([
      'depends on v_probe_helper (relkind v), which is neither a base table nor a reporting relation',
      'depends on helper_fn (relkind f), which is neither a base table nor a reporting relation',
    ]);
  });
});
