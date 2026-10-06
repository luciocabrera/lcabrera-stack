import type { EnvelopeShape } from './envelope.types.ts';

import { DETAIL_SCHEMA_BY_SUITE } from './envelope.constants.ts';

export const envelopeConsistencyIssues = ({
  run,
  tasks,
  trials,
}: EnvelopeShape) => {
  const expectedDetail = DETAIL_SCHEMA_BY_SUITE[run.suite];
  const taskKeys = new Set(tasks.map(({ task_key }) => task_key));

  return trials.flatMap(({ detail, error_class, outcome, task_key }, index) => [
    ...(detail.schema === expectedDetail
      ? []
      : [
          {
            code: 'custom' as const,
            message: `suite ${run.suite} records detail ${expectedDetail}, not ${detail.schema}`,
            path: ['trials', index, 'detail', 'schema'],
          },
        ]),
    ...(taskKeys.has(task_key)
      ? []
      : [
          {
            code: 'custom' as const,
            message: `trial names task ${task_key}, which no entry in tasks declares`,
            path: ['trials', index, 'task_key'],
          },
        ]),
    ...(outcome === 'error' && typeof error_class !== 'string'
      ? [
          {
            code: 'custom' as const,
            message: 'an error trial names its error_class',
            path: ['trials', index, 'error_class'],
          },
        ]
      : []),
  ]);
};
