import { z } from 'zod';

/**
 * SESSION_SECRET signs the auth session cookie (ADR-017). The default is a
 * deliberate dev-only convenience for this internal tool — set a real value
 * in the environment for anything beyond local use; sessions are
 * invalidated whenever it changes.
 */
export const sessionEnvSchema = z.object({
  SESSION_SECRET: z.string().min(1).default('cqms-dev-insecure-secret'),
});

export type SessionEnvConfig = z.infer<typeof sessionEnvSchema>;

type ReadSessionEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readSessionEnvConfig = ({ env }: ReadSessionEnvConfigArgs) =>
  sessionEnvSchema.parse(env);
