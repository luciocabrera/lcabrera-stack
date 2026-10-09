import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';
import type { annotationSchema } from './annotation.schema.ts';

import { ANNOTATION_KINDS } from './annotations.constants.ts';
import { recordAnnotationQuery } from './recordAnnotationQuery.util.ts';

type RecordAnnotationArgs = {
  readonly annotation: z.output<typeof annotationSchema>;
  readonly client: QueryClient;
};

const recordedSchema = z.tuple([
  z.object({ at: z.date(), id: z.string(), kind: z.enum(ANNOTATION_KINDS) }),
]);

export const recordAnnotation = async ({
  annotation,
  client,
}: RecordAnnotationArgs) => {
  const { rows } = await client.query(recordAnnotationQuery(annotation));
  const [recorded] = recordedSchema.parse(rows);

  return recorded;
};
