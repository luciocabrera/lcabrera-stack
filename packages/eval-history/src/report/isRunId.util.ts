import { z } from 'zod';

const runIdSchema = z.guid();

export const isRunId = (ref: string) => runIdSchema.safeParse(ref).success;
