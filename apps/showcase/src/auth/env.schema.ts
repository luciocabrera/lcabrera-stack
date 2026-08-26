import { z } from 'zod';

/**
 * **No real secret is committed, and every default here is public.**
 * `AUTH_DEMO_PASSWORD_HASH` is a scrypt hash of `demo-password-123`, deliberately
 * public: it is the showcase's demo login against a demo database.
 * `AUTH_TOKEN_SECRET` is a dev placeholder.
 *
 * **Override both in any real deployment — nothing here enforces that.** These are
 * `.default()`s, not requirements, so a deployment that sets neither starts up
 * perfectly happily and signs every session token with a string published in this
 * repository. There is no `NODE_ENV` branch and no gate that fails on an absent
 * var; the default is exactly what makes the omission silent. Generate a
 * replacement hash with `hashSecret({ secret })` from
 * `@lcabrera/server/crypto/hash-secret.util`.
 *
 * Do not add a default for anything that is not public by construction.
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
