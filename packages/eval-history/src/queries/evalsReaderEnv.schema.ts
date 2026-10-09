import { z } from 'zod';

export const evalsReaderEnvSchema = z.object({
  EVALS_READER_DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
});
