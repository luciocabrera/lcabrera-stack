import { z } from 'zod';

/**
 * **No real secret is committed.** `AUTH_DEMO_PASSWORD_HASH`'s default is a scrypt hash
 * of `demo-password-123`, a password that is deliberately public: it is the showcase's
 * demo login and grants nothing but this app's own secured routes against a demo
 * database. `AUTH_TOKEN_SECRET`'s default is likewise a dev placeholder. Both are
 * defaults, so a real deployment overrides them from the environment and neither
 * default ever reaches one — which is the property to preserve if you touch this
 * schema. Do not add a default for anything that is not public by construction.
 */
const authEnvSchema = z.object({
  AUTH_DEMO_EMAIL: z.string().min(1).default('demo@example.com'),
  AUTH_DEMO_PASSWORD_HASH: z
    .string()
    .min(1)
    .default(
      '400f90577433d27877d7ca93cfe2a18f:83d8f37dffaa375673a81a2349bbf06cd85c9ec421f984dd9a8fcc8e369df70aacc6c54a872f7d79f086487748f3d07268722458fc95ac705ca310bfa26da6ad',
    ),
  AUTH_TOKEN_SECRET: z
    .string()
    .min(1)
    .default('react-router-dev-insecure-auth-secret'),
});

type ReadAuthEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readAuthEnvConfig = ({ env }: ReadAuthEnvConfigArgs) =>
  authEnvSchema.parse(env);
