import { evalsDatabaseEnvSchema } from '../migrate/evalsDatabaseEnv.schema.ts';
import { ReportInputError } from './reportInput.error.ts';

const UNSET =
  'EVALS_DATABASE_URL is unset, so a run id or --compare has nothing to read; pass two envelope files to --a and --b instead';

const INVALID = 'EVALS_DATABASE_URL must be a postgres:// URL';

export const connectionUrl = (connectionString: string | undefined) => {
  if (!connectionString) {
    throw new ReportInputError(UNSET);
  }

  const env = evalsDatabaseEnvSchema.safeParse({
    EVALS_DATABASE_URL: connectionString,
  });

  if (!env.success) {
    throw new ReportInputError(INVALID);
  }

  return env.data.EVALS_DATABASE_URL;
};
