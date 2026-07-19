import { isSecretHashValid } from '@repo/data-access/crypto/isSecretHashValid.util';

import type { DemoCredential } from './auth.types';

type VerifyCredentialsArgs = {
  readonly credential: DemoCredential;
  readonly email: string;
  readonly password: string;
};

/**
 * Verifies a submitted email + password against the demo credential. The email
 * is matched case-insensitively; the password is checked against the stored
 * scrypt hash via `isSecretHashValid` (constant-time internally). Returns a
 * plain boolean so the caller can respond with one no-oracle message for both
 * unknown-email and wrong-password.
 *
 * Pure: `isSecretHashValid` is deterministic given its inputs.
 */
export const verifyCredentials = ({
  credential,
  email,
  password,
}: VerifyCredentialsArgs) =>
  credential.email.toLowerCase() === email.toLowerCase() &&
  isSecretHashValid({ secret: password, secretHash: credential.secretHash });
