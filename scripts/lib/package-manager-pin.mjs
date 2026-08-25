/**
 * Reading the `packageManager` pin, and judging what a refresh did to it.
 *
 * Why this exists: during a dependency refresh that field is written TWICE, by
 * two tools with different jobs, and neither one's exit code describes what the
 * field ends up holding (#927).
 *
 * `taze --write` moves the version and writes it BARE — `pnpm@11.23.0`, no
 * hash. `corepack use pnpm@latest` then rewrites the same field WITH the
 * `+sha…`, and that hash is the whole supply-chain guarantee on the pin: it is
 * what makes the pin an integrity check rather than a version preference.
 *
 * The trap that motivated this module is corepack exiting non-zero AFTER
 * completing its write. The distro corepack that Node 26 leaves on PATH
 * installs pnpm, rewrites the field, then dies launching it — so a caller
 * reading the exit code concludes the pin did not move while it is sitting
 * there, moved and correctly hashed. The inverse is the dangerous one: a
 * corepack that dies BEFORE its write leaves taze's bare version behind, the
 * refresh reports success, and the pin has quietly lost its integrity check.
 *
 * So: read the field, never the exit code. These functions are pure so the
 * three outcomes can be tested without a corepack that fails on demand.
 *
 * Governed by .claude/rules/scripts.md.
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

  return pin !== null && pin.algorithm !== null && pin.digest !== null;
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
