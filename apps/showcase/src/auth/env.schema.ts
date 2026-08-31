/**
 * The auth environment contract, and the reason its defaults are withheld
 * outside development.
 *
 * `AUTH_DEMO_PASSWORD_HASH` is a scrypt hash of a password published in this
 * repository's docs and `AUTH_TOKEN_SECRET` is a placeholder, so deploying with
 * either means anyone who has read the repository can log in. Generate a
 * replacement with `hashSecret({ secret })` from
 * `@lcabrera/server/crypto/hash-secret.util`. Do not add a default here for
 * anything that is not public by construction.
 *
 * The permitted modes are tested rather than `production`, and that is the
 * load-bearing part: a deployment that never set `NODE_ENV` — which is what
 * `node build/server/index.js` starts with — and one that sets `staging` are
 * both not-`production`, so guarding that one name would hand the published
 * secret back to exactly the deployments this file exists to stop. `test` is
 * permitted because the auth suites parse this schema at module scope.
 */

import { z } from 'zod';

const DEVELOPMENT_MODES = new Set(['development', 'test']);

const PERMITTED_MODES = [...DEVELOPMENT_MODES].join(' or ');

type PublicDefaultArgs = {
  readonly devDefault: string;
  readonly isDevelopment: boolean;
  readonly name: string;
};

const publicDefault = ({
  devDefault,
  isDevelopment,
  name,
}: PublicDefaultArgs) => {
  if (isDevelopment) {
    return z
      .string()
      .min(
        1,
        `${name} is set but empty — remove the line to use the published development default, or give it a value.`,
      )
      .default(devDefault);
  }

  const refusal = `${name} must be set unless NODE_ENV is ${PERMITTED_MODES} — its development default is published in this repository and does not apply here.`;

  return z.string({ error: refusal }).min(1, refusal);
};

const authEnvSchema = (isDevelopment: boolean) =>
  z.object({
    AUTH_DEMO_EMAIL: z.string().min(1).default('demo@example.com'),
    AUTH_DEMO_PASSWORD_HASH: publicDefault({
      devDefault:
        '400f90577433d27877d7ca93cfe2a18f:83d8f37dffaa375673a81a2349bbf06cd85c9ec421f984dd9a8fcc8e369df70aacc6c54a872f7d79f086487748f3d07268722458fc95ac705ca310bfa26da6ad',
      isDevelopment,
      name: 'AUTH_DEMO_PASSWORD_HASH',
    }),
    AUTH_TOKEN_SECRET: publicDefault({
      devDefault: 'react-router-dev-insecure-auth-secret',
      isDevelopment,
      name: 'AUTH_TOKEN_SECRET',
    }),
  });

type ReadAuthEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readAuthEnvConfig = ({ env }: ReadAuthEnvConfigArgs) =>
  authEnvSchema(DEVELOPMENT_MODES.has(env.NODE_ENV ?? '')).parse(env);
