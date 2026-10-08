import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { readJsonFile } from '../files/readJsonFile.service.ts';
import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import {
  EXCLUDED_COLUMNS,
  PUBLIC_FIELD_PATHS,
  REPORTING_RELATIONS,
} from '../queries/queries.constants.ts';
import { viewDependencyViolations } from './viewDependencyViolations.util.ts';
import { viewReadViolations } from './viewReadViolations.util.ts';

const JSONB_COLUMNS = [
  'eval_run.env',
  'eval_run.settings',
  'eval_run.totals',
  'eval_trial_detail.detail',
];

const PROBES_FILE = fileURLToPath(
  new URL('fixtures/view-probes.pg18.json', import.meta.url),
);

const dependencySchema = z.object({ kind: z.string(), relation: z.string() });

const probesSchema = z.array(
  z.object({
    definition: z.string(),
    dependencies: z.array(dependencySchema),
    name: z.string(),
    registered: z.boolean(),
  }),
);

const probes = await readJsonFile({
  describedAs: 'PG18 view probes',
  file: PROBES_FILE,
  schema: probesSchema,
});

type Probe = (typeof probes)[number];

const violationsOf = ({ definition, dependencies }: Probe) => [
  ...viewReadViolations({
    definition,
    dependsOn: dependencies.map(({ relation }) => relation),
    fieldPaths: PUBLIC_FIELD_PATHS,
    guarded: EXCLUDED_COLUMNS,
    jsonbColumns: JSONB_COLUMNS,
  }).violations,
  ...viewDependencyViolations({ allowed: REPORTING_RELATIONS, dependencies }),
];

describe('viewReadViolations over PG18 deparsed probe views', () => {
  it('holds the agreement view and an unregistered probe of every reported kind', () => {
    expect(probes.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'v-judge-agreement',
        'quoted-alias',
        'quoted-alias-lateral',
        'to-jsonb-detail-row',
        'to-jsonb-grade-row',
        'to-jsonb-trial-row',
        'helper-view',
      ]),
    );
  });

  it.each(probes.filter(({ registered }) => registered))(
    'finds nothing in registered view $name',
    (probe) => {
      expect(violationsOf(probe)).toEqual([]);
    },
  );

  it.each(probes.filter(({ registered }) => !registered))(
    'finds a violation in unregistered view $name',
    (probe) => {
      expect(violationsOf(probe)).not.toEqual([]);
    },
  );

  it('reads exactly the registered paths from the agreement view', () => {
    const agreement = probes.find(({ name }) => name === 'v-judge-agreement');

    expect(
      viewReadViolations({
        definition: agreement?.definition ?? '',
        dependsOn: [],
        fieldPaths: PUBLIC_FIELD_PATHS,
        guarded: EXCLUDED_COLUMNS,
        jsonbColumns: JSONB_COLUMNS,
      }).reads.toSorted(compareCodeUnits),
    ).toEqual([...PUBLIC_FIELD_PATHS].toSorted(compareCodeUnits));
  });

  it.each([
    {
      expected: 'eval_trial_detail.detail.summary',
      name: 'quoted-alias-lateral',
    },
    {
      expected: 'eval_trial_detail read as a whole row through detail',
      name: 'to-jsonb-detail-row',
    },
    {
      expected: 'eval_human_grade read as a whole row through grade',
      name: 'to-jsonb-grade-row',
    },
    {
      expected: 'eval_trial read as a whole row through trial',
      name: 'to-jsonb-trial-row',
    },
    {
      expected: 'eval_trial_detail.detail.dimensions[].feedback',
      name: 'element-feedback',
    },
    { expected: 'eval_human_grade.grader', name: 'grader-column' },
  ])('names $expected in $name', ({ expected, name }) => {
    const probe = probes.find((candidate) => candidate.name === name);

    expect(probe && violationsOf(probe)).toContain(expected);
  });

  it('fails a guarded table read without a declaration it can follow', () => {
    expect(
      viewReadViolations({
        definition: 'SELECT 1 FROM eval_trial_detail',
        dependsOn: ['eval_trial_detail'],
        fieldPaths: PUBLIC_FIELD_PATHS,
        guarded: EXCLUDED_COLUMNS,
        jsonbColumns: JSONB_COLUMNS,
      }).violations,
    ).toEqual([
      'evals.eval_trial_detail is read in a form the check cannot follow',
    ]);
  });
});
