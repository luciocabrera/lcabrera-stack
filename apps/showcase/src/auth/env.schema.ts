import { z } from 'zod';

/**
 * Every default here is public, and outside development none of them applies.
 *
 * `AUTH_DEMO_PASSWORD_HASH` is a scrypt hash of `demo-password-123` and
 * `AUTH_TOKEN_SECRET` is a dev placeholder — both readable by anyone who opens
 * this repository. A `.default()` is what made forgetting them silent: a
 * deployment that set neither started up perfectly happily and signed every
 * session token with a published string.
 *
 * So the defaults are withheld when `NODE_ENV` is `production`, and the parse
 * fails by name instead. That includes the demo password hash: deploying the
 * showcase publicly with it means anyone who has read this repository can log
 * in, which is fine as a decision and not fine as an oversight — setting it back
 * to the published value is one line and puts the choice on the record.
 * `AUTH_DEMO_EMAIL` keeps its default in every mode; an address is not a
 * credential.
 *
 * Generate a replacement hash with `hashSecret({ secret })` from
 * `@lcabrera/server/crypto/hash-secret.util`.
 *
 * Do not add a default for anything that is not public by construction.
 */
type PublicDefaultArgs = {
  readonly devDefault: string;
  readonly isProduction: boolean;
  readonly name: string;
};

/**
 * A value with a published development default, withheld outside development.
 *
 * The message carries the fix rather than only the fault: a bare "Required"
 * leaves the reader to work out that a default exists and why it stopped
 * applying. `name` is passed rather than read from the key because Zod gives the
 * schema no idea what it was assigned to — the "names its own variable" test is
 * what keeps the two in step.
 */
const publicDefault = ({
  devDefault,
  isProduction,
  name,
}: PublicDefaultArgs) =>
  isProduction
    ? z
        .string({
          error: `${name} must be set when NODE_ENV=production — its development default is published in this repository and does not apply here.`,
        })
        .min(1)
    : z.string().min(1).default(devDefault);

const authEnvSchema = (isProduction: boolean) =>
  z.object({
    AUTH_DEMO_EMAIL: z.string().min(1).default('demo@example.com'),
    AUTH_DEMO_PASSWORD_HASH: publicDefault({
      devDefault:
        '400f90577433d27877d7ca93cfe2a18f:83d8f37dffaa375673a81a2349bbf06cd85c9ec421f984dd9a8fcc8e369df70aacc6c54a872f7d79f086487748f3d07268722458fc95ac705ca310bfa26da6ad',
      isProduction,
      name: 'AUTH_DEMO_PASSWORD_HASH',
    }),
    AUTH_TOKEN_SECRET: publicDefault({
      devDefault: 'react-router-dev-insecure-auth-secret',
      isProduction,
      name: 'AUTH_TOKEN_SECRET',
    }),
  });

type ReadAuthEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

/**
 * `NODE_ENV` is taken off the passed `env` rather than the ambient process, so
 * the production branch is reachable from a test without mutating anything.
 */
export const readAuthEnvConfig = ({ env }: ReadAuthEnvConfigArgs) =>
  authEnvSchema(env.NODE_ENV === 'production').parse(env);
