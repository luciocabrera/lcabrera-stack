import type { z } from 'zod';

import type { annotationSchema } from './annotation.schema.ts';

export const recordAnnotationQuery = ({
  at,
  author,
  kind,
  text,
}: z.output<typeof annotationSchema>) => ({
  text: `insert into evals.eval_annotation (at, kind, text, author)
values ($1, $2, $3, $4)
returning id::text as id, at, kind`,
  values: [at, kind, text, author],
});
