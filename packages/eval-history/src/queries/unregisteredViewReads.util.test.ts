import { describe, expect, it } from 'vite-plus/test';

import { unregisteredViewReads } from './unregisteredViewReads.util.ts';

const DETAIL = 'eval_trial_detail.detail';

const base = {
  fieldPaths: [`${DETAIL}.judge_model`],
  guarded: [DETAIL, 'eval_run.actor'],
  jsonbColumns: [DETAIL],
};

const definitionOf = (select: string) =>
  new Map([
    ['v_probe', `SELECT ${select} FROM evals.eval_trial_detail detail`],
  ]);

describe('unregisteredViewReads', () => {
  it('passes a guarded jsonb column read only through registered paths', () => {
    expect(
      unregisteredViewReads({
        ...base,
        definitions: definitionOf("detail.detail ->> 'judge_model'::text"),
        usage: [{ column: DETAIL, view: 'v_probe' }],
      }),
    ).toEqual([]);
  });

  it('names an unregistered path and a bare read of the column', () => {
    expect(
      unregisteredViewReads({
        ...base,
        definitions: definitionOf(
          "detail.detail ->> 'summary'::text, detail.detail",
        ),
        usage: [{ column: DETAIL, view: 'v_probe' }],
      }),
    ).toEqual([`v_probe: ${DETAIL}.summary`, `v_probe: ${DETAIL}`]);
  });

  it('names a guarded column that is not jsonb outright', () => {
    expect(
      unregisteredViewReads({
        ...base,
        definitions: definitionOf('run.actor'),
        usage: [{ column: 'eval_run.actor', view: 'v_probe' }],
      }),
    ).toEqual(['v_probe: eval_run.actor']);
  });

  it('fails closed when it cannot find how the view reads the column', () => {
    expect(
      unregisteredViewReads({
        ...base,
        definitions: new Map(),
        usage: [{ column: DETAIL, view: 'v_probe' }],
      }),
    ).toEqual([`v_probe: ${DETAIL}`]);
  });

  it('ignores columns that are not guarded', () => {
    expect(
      unregisteredViewReads({
        ...base,
        definitions: definitionOf('trial.outcome'),
        usage: [{ column: 'eval_trial.outcome', view: 'v_probe' }],
      }),
    ).toEqual([]);
  });
});
