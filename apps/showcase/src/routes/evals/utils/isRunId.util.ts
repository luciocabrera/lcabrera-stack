import { z } from 'zod';

const runIdSchema = z.guid();

export const isRunId = (value: unknown): value is string =>
  runIdSchema.safeParse(value).success;
