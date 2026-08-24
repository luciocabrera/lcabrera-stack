import { isSecretHashValid } from '@lcabrera/server/crypto/is-secret-hash-valid.util';

import type { DemoCredential } from './auth.types';

type VerifyCredentialsArgs = {
  readonly credential: DemoCredential;
  readonly email: string;
  readonly password: string;
};

export const verifyCredentials = ({
  credential,
  email,
  password,
}: VerifyCredentialsArgs) =>
  credential.email.toLowerCase() === email.toLowerCase() &&
  isSecretHashValid({ secret: password, secretHash: credential.secretHash });
