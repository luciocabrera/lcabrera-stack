import { z } from 'zod';

import { ANNOTATION_KINDS } from './annotations.constants.ts';

export const annotationSchema = z.strictObject({
  at: z.iso.datetime({ offset: true }),
  author: z.string().trim().min(1),
  kind: z.enum(ANNOTATION_KINDS),
  text: z.string().trim().min(1),
});
