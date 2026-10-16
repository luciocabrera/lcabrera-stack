import { z } from 'zod';

export const evalsMigrateDatabaseEnvSchema = z.object({
  EVALS_MIGRATE_DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
});
