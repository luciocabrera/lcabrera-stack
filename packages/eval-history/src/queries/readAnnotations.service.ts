import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { ANNOTATION_KINDS } from '../annotations/annotations.constants.ts';
import { annotationsQuery } from './annotationsQuery.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';

type ReadAnnotationsArgs = Omit<
  Parameters<typeof annotationsQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const annotationRowsSchema = z.array(
  z.object({
    annotationId: z.string().regex(/^\d+$/u),
    at: z.date(),
    kind: z.enum(ANNOTATION_KINDS),
  }),
);

export const readAnnotations = async ({
  client,
  ...args
}: ReadAnnotationsArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    annotationsQuery({ ...args, publicColumns }),
  );

  return annotationRowsSchema.parse(rows);
};
