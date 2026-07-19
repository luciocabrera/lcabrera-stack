import { timingSafeEqual } from 'node:crypto';

type TimingSafeStringEqualArgs = {
  readonly a: string;
  readonly b: string;
};

/**
 * Constant-time string comparison for verifying signatures/secrets, so a
 * partial match leaks no timing signal. Strings of differing length can't be
 * compared by `timingSafeEqual` (it throws), so they short-circuit to `false`
 * — length is not itself a secret here (signatures are fixed-width hex).
 *
 * Pure and server-only (`node:crypto`) — hence the `.server.ts` suffix.
 */
export const timingSafeStringEqual = ({ a, b }: TimingSafeStringEqualArgs) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};
