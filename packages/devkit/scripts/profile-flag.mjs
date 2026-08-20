/*
 * Reading `--profile <name>` out of an argv — once, for every command that takes
 * it.
 *
 * Why it is not three lines in each command: a bare "value after the flag" read
 * answers `undefined` both when the flag is absent and when it is present with
 * nothing after it, and those must not mean the same thing. Absent means "use
 * the configured profile". Present-and-valueless is a typo, and reading it as
 * absent is the worst available outcome: `doctor --check --profile` would check
 * the narrower configured set and exit 0 over a tree it was asked to look at
 * more widely — the same clean run as a tree with nothing wrong in it, which is
 * the failure the flag exists to prevent.
 *
 * A flag-shaped value is treated the same way, so `--profile --check` cannot
 * consume `--check` as a profile name and quietly turn the check off with it.
 */

export const PROFILE_FLAG = '--profile';

export const PROFILE_FLAG_ERROR = `${PROFILE_FLAG} needs a profile name after it`;

/**
 * @param {string[]} argv
 * @returns {{ profile?: string, rest: string[], error?: string }} `rest` is the
 * argv with the flag and its value removed, so a caller reading positional
 * arguments never sees them.
 */
export const readProfileFlag = (argv) => {
  const index = argv.indexOf(PROFILE_FLAG);
  if (index === -1) return { rest: argv };

  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    return { error: PROFILE_FLAG_ERROR, rest: argv };
  }

  return {
    profile: value,
    rest: [...argv.slice(0, index), ...argv.slice(index + 2)],
  };
};
