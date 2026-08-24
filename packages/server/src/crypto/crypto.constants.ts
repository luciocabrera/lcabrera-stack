/**
 * scrypt parameters shared by `hashSecret` and `isSecretHashValid`. They live here rather
 * than in either util because the two halves must agree: a key length that drifts between
 * hashing and verification silently fails every comparison.
 * Cost params are node:crypto's defaults (N=16384/r=8/p=1). scrypt is used over
 * bcrypt/argon2 to keep the dependency count at zero (ADR-017).
 */
export const SCRYPT_SALT_BYTES = 16;
export const SCRYPT_KEY_LENGTH = 64;
