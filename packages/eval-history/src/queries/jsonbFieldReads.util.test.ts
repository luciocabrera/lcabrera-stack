import { describe, expect, it } from 'vite-plus/test';

import { jsonbFieldReads } from './jsonbFieldReads.util.ts';

const column = 'eval_trial_detail.detail';

const AGREEMENT_VIEW = ` SELECT grade.trial_id,
    detail.detail ->> 'judge_model'::text AS judge_model,
    judged.score AS judge_score
   FROM evals.eval_human_grade grade
     JOIN evals.eval_trial_detail detail ON detail.trial_id = grade.trial_id AND detail.detail_schema = 'quality/1'::text
     JOIN LATERAL ( SELECT (dimension.value ->> 'score'::text)::double precision AS score
           FROM jsonb_array_elements(detail.detail -> 'dimensions'::text) dimension(value)
          WHERE (dimension.value ->> 'name'::text) = grade.dimension
         LIMIT 1) judged ON true;`;

describe('jsonbFieldReads', () => {
  it('names every field path a view definition reads from the column', () => {
    expect(jsonbFieldReads({ column, definition: AGREEMENT_VIEW })).toEqual([
      'eval_trial_detail.detail.judge_model',
      'eval_trial_detail.detail.dimensions[].score',
      'eval_trial_detail.detail.dimensions[].name',
    ]);
  });

  it('reads the same paths from the parenthesised form pg_views prints', () => {
    const definition = ` SELECT (detail.detail ->> 'judge_model'::text) AS judge_model
     FROM evals.eval_trial_detail detail
     JOIN LATERAL ( SELECT ((dimension.value ->> 'score'::text))::double precision AS score
           FROM jsonb_array_elements((detail.detail -> 'dimensions'::text)) dimension(value)
          WHERE ((dimension.value ->> 'name'::text) = grade.dimension)) judged ON true;`;

    expect(jsonbFieldReads({ column, definition })).toEqual([
      'eval_trial_detail.detail.judge_model',
      'eval_trial_detail.detail.dimensions[].score',
      'eval_trial_detail.detail.dimensions[].name',
    ]);
  });

  it('reports a field the view adds, and the whole column read bare', () => {
    const definition = AGREEMENT_VIEW.replace(
      'judged.score AS judge_score',
      "detail.detail ->> 'summary'::text AS summary, detail.detail AS everything",
    );

    expect(jsonbFieldReads({ column, definition })).toEqual(
      expect.arrayContaining([
        'eval_trial_detail.detail.summary',
        'eval_trial_detail.detail',
      ]),
    );
  });

  it('reports a sub-tree taken outside jsonb_array_elements', () => {
    expect(
      jsonbFieldReads({
        column,
        definition:
          "SELECT d.detail -> 'dimensions'::text AS dimensions FROM evals.eval_trial_detail d",
      }),
    ).toEqual(['eval_trial_detail.detail.dimensions']);
  });

  it('reports an element field the view reads besides the registered ones', () => {
    const definition = AGREEMENT_VIEW.replace(
      'AS score\n',
      "AS score, dimension.value ->> 'feedback'::text AS feedback\n",
    );

    expect(jsonbFieldReads({ column, definition })).toContain(
      'eval_trial_detail.detail.dimensions[].feedback',
    );
  });

  it('reads nothing from a definition that never names the table', () => {
    expect(
      jsonbFieldReads({
        column,
        definition: 'SELECT 1 FROM evals.eval_run run',
      }),
    ).toEqual([]);
  });
});
