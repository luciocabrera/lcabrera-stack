import type { DemoCredential } from './auth.types';

import { readAuthEnvConfig } from './env.schema';

type GetDemoCredentialArgs = {
  readonly env: NodeJS.ProcessEnv;
};

/**
 * Only the password **hash** is ever surfaced — the plaintext demo password lives in docs,
 * never in code.
 */
export const getDemoCredential = ({
  env,
}: GetDemoCredentialArgs): DemoCredential => {
  const { AUTH_DEMO_EMAIL, AUTH_DEMO_PASSWORD_HASH } = readAuthEnvConfig({
    env,
  });

  return { email: AUTH_DEMO_EMAIL, secretHash: AUTH_DEMO_PASSWORD_HASH };
};
