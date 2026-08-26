import { z } from 'zod';

/**
 * The modes a published default applies in; every other value is refused.
 *
 * Testing the permitted values rather than `production` is the load-bearing
 * part. A deployment that never set `NODE_ENV` — which is what
 * `node build/server/index.js` starts with — and one that sets `staging` are
 * both not-`production`, so guarding that one name would hand the published
 * secret back to exactly the deployments this file exists to stop.
 *
 * `test` is here because three test files read the ambient process env at module
 * scope; narrowing this to `development` alone breaks them at import time.
 */
const DEVELOPMENT_MODES = new Set(['development', 'test']);

/** Spelled from the set, so the message cannot drift from what is accepted. */
const PERMITTED_MODES = [...DEVELOPMENT_MODES].join(' or ');

type PublicDefaultArgs = {
  readonly devDefault: string;
  readonly isDevelopment: boolean;
  readonly name: string;
};

/**
 * A value with a published development default, withheld outside development.
 *
 * `name` is passed rather than read from the key because Zod gives the schema no
 * idea what it was assigned to; the "names its own variable" test keeps the two
 * in step.
 *
 * Do not add a default here for anything that is not public by construction.
 */
const publicDefault = ({
  devDefault,
  isDevelopment,
  name,
}: PublicDefaultArgs) => {
  if (isDevelopment) return z.string().min(1).default(devDefault);

  // The same message on both the type error and the length check. A variable a
  // deploy platform declared and left blank arrives as `''`, which `.min(1)`
  // rejects on its own terms — "Too small: expected string to have >=1
  // characters", naming nothing. Probed rather than assumed: a schema-level
  // `error` is not a blanket map over checks, and `error: () => …` does not
  // reach this one either.
  const refusal = `${name} must be set unless NODE_ENV is ${PERMITTED_MODES} — its development default is published in this repository and does not apply here.`;

  return z.string({ error: refusal }).min(1, refusal);
};

/**
 * `AUTH_DEMO_PASSWORD_HASH` is a scrypt hash of `demo-password-123` and
 * `AUTH_TOKEN_SECRET` is a placeholder — both readable by anyone who opens this
 * repository, which is why neither survives outside development. The hash is
 * withheld deliberately: deploying the showcase publicly with it means anyone
 * who has read this repository can log in. Generate a replacement with
 * `hashSecret({ secret })` from `@lcabrera/server/crypto/hash-secret.util`.
 *
 * `AUTH_DEMO_EMAIL` keeps its default in every mode; an address is not a
 * credential.
 */
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

/**
 * `NODE_ENV` is taken off the passed `env` rather than the ambient process, so
 * the refusing branch is reachable from a test without mutating anything.
 */
export const readAuthEnvConfig = ({ env }: ReadAuthEnvConfigArgs) =>
  authEnvSchema(DEVELOPMENT_MODES.has(env.NODE_ENV ?? '')).parse(env);
