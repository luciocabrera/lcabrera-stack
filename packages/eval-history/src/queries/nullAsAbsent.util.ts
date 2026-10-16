import type { z } from 'zod';

export const nullAsAbsent = <TSchema extends z.ZodType>(schema: TSchema) =>
  schema.nullable().transform((value) => value ?? undefined);
