import { z } from 'zod';

export const evalsDatabaseEnvSchema = z.object({
  EVALS_DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
});
