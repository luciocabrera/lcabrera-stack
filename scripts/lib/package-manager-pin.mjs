/**
 * Reading the `packageManager` pin, and judging what a refresh did to it.
 *
 * taze writes the version bare; corepack adds the `+sha…`. Neither exit code
 * says what the field holds, so read the field. Background: #927.
 */

/**
 * `name@version` with corepack's optional `+algorithm.digest` suffix.
 *
 * The name excludes `@` so the split point is unambiguous, and the version
 * excludes `+` so the hash cannot be swallowed into it. No nested quantifier,
 * which is what keeps this off Sonar's backtracking rule (S8786).
 */
const PIN_PATTERN =
  /^(?<name>[^@\s]+)@(?<version>[^+\s]+)(?:\+(?<algorithm>[a-z0-9]+)\.(?<digest>[a-f0-9]+))?$/u;

/**
 * Split a `packageManager` value into its parts, or `null` when it is not a pin.
 *
 * @param {unknown} value
 */
export const parsePackageManagerPin = (value) => {
  if (typeof value !== 'string') return null;

  const match = PIN_PATTERN.exec(value.trim());
  if (!match?.groups) return null;

  const { algorithm, digest, name, version } = match.groups;

  return {
    algorithm: algorithm ?? null,
    digest: digest ?? null,
    name,
    version,
  };
};

/**
 * Whether a pin carries the `+algorithm.digest` corepack appends.
 *
 * A bare pin is not malformed — it is what taze writes, and what pnpm accepts.
 * It is simply missing the integrity half, which is the part no gate notices.
 *
 * @param {unknown} value
 */
export const hasIntegrityHash = (value) => {
  const pin = parsePackageManagerPin(value);

  // Both halves arrive together or not at all — the pattern cannot match one
  // without the other — so this asserts the pair rather than either alone.
  return Boolean(pin?.algorithm && pin.digest);
};

/**
 * What a refresh actually did to the pin, given the field before and after.
 *
 * `corepackFailed` is the exit status, and it is deliberately NOT what decides
 * the verdict — it only changes the wording, because the same non-zero exit
 * accompanies both a completed write and an abandoned one.
 *
 * @param {{ after: unknown, before: unknown, corepackFailed?: boolean }} args
 * @returns {{ level: 'error' | 'ok' | 'warn', message: string }}
 */
export const describePinOutcome = ({
  after,
  before,
  corepackFailed = false,
}) => {
  const from = typeof before === 'string' ? before : '(absent)';
  const to = typeof after === 'string' ? after : '(absent)';
  const moved = from !== to;

  if (!hasIntegrityHash(after)) {
    return {
      level: 'error',
      message: moved
        ? `the packageManager pin moved to ${to} but carries no integrity hash — corepack did not complete its write`
        : `the packageManager pin ${to} carries no integrity hash — corepack did not complete its write`,
    };
  }

  if (corepackFailed) {
    return {
      level: 'warn',
      message: moved
        ? `corepack exited non-zero but had already written the pin: ${from} → ${to}`
        : `corepack exited non-zero; the pin is unchanged at ${to}`,
    };
  }

  return {
    level: 'ok',
    message: moved
      ? `the packageManager pin moved: ${from} → ${to}`
      : `the packageManager pin is unchanged at ${to}`,
  };
};
