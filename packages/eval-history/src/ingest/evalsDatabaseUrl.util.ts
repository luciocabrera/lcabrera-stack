import { evalsDatabaseEnvSchema } from '../migrate/evalsDatabaseEnv.schema.ts';

type EvalsDatabaseUrlArgs = {
  readonly command: string;
  readonly connectionString: string | undefined;
  readonly whenUnset: string;
};

export const evalsDatabaseUrl = ({
  command,
  connectionString,
  whenUnset,
}: EvalsDatabaseUrlArgs) => {
  if (!connectionString) {
    return {
      message: `${command}: EVALS_DATABASE_URL is unset, so ${whenUnset} (ADR-130)`,
      ok: false,
      reason: 'unset',
    } as const;
  }

  const env = evalsDatabaseEnvSchema.safeParse({
    EVALS_DATABASE_URL: connectionString,
  });

  return env.success
    ? ({ ok: true, url: env.data.EVALS_DATABASE_URL } as const)
    : ({
        message: `${command}: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)`,
        ok: false,
        reason: 'invalid',
      } as const);
};
