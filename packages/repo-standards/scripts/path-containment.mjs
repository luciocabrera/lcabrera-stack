/**
 * The containment test behind `safe-read.mjs` and `safe-write.mjs`: does a path
 * that came from an untrusted CLI argument resolve inside one of the allowed
 * roots?
 *
 * It lives on its own because both of those need exactly the same predicate,
 * and two copies of a security check is the case where duplication actually
 * bites — hardening one (a trailing separator on a root, a symlink, `relative`
 * instead of `startsWith`) would leave the other quietly weaker, with nothing
 * pairing them.
 *
 * It returns the **resolved path** rather than a boolean on purpose: the caller
 * then passes that value to the filesystem, so what reaches `fs` is the value
 * this function validated rather than the argument it was derived from.
 */
import { resolve, sep } from 'node:path';

/** The resolved path when it is inside one of `roots`, `undefined` otherwise. (pure) */
export const resolveWithin = (path, roots) => {
  const resolved = resolve(path);
  const contained = roots.some(
    (root) =>
      typeof root === 'string' &&
      root !== '' &&
      (resolved === root || resolved.startsWith(root + sep)),
  );
  return contained ? resolved : undefined;
};
