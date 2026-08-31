/*
 * Deciding whether a formatter/linter config file is one nothing reads.
 *
 * The invariant travels; the roster does not. "No config file exists that no
 * engine reads" is true of any repository, but WHICH names qualify is a
 * per-toolchain answer — `.prettierrc` is a decoy in a repository formatted by
 * something else and the live policy in a repository formatted by Prettier. So
 * the names arrive as configuration and this module only decides.
 *
 * Checked by NAME rather than by content, and that is what makes the gate fail
 * closed: a decoy is defined by nothing loading it, and there is no observable
 * difference between one whose values happen to agree with the live config and
 * one that contradicts it — until somebody edits it and nothing happens.
 *
 * The failure it was written for: a root `.oxfmtrc.json` declaring
 * `sortPackageJson: false` while the live config declared `true`, so the file a
 * reader would naturally open to learn the policy stated the opposite of the
 * truth. Alongside it, two ignore files naming only a directory that had been
 * deleted — a cleanup that removed the thing but not its references.
 *
 * Pure: callers hand in already-collected paths, so the traversal stays in the
 * CLI and this half needs no fixture tree.
 */

/**
 * A prefix rule as well as a name set, because some tools accept a family of
 * spellings — `.prettierrc`, `.prettierrc.json`, `.prettierrc.yaml` — that a set
 * of exact names cannot cover without listing every variant and still missing
 * the next one.
 */
export const isStrayConfig = ({ filename, unreadNames, unreadPrefixes }) =>
  unreadNames.includes(filename) ||
  unreadPrefixes.some((prefix) => filename.startsWith(prefix));

const basename = (path) => path.slice(path.lastIndexOf('/') + 1);

export const strayConfigsIn = ({ paths, unreadNames, unreadPrefixes }) =>
  paths.filter((path) =>
    isStrayConfig({
      filename: basename(path),
      unreadNames,
      unreadPrefixes,
    }),
  );

export const rosterProblem = ({ unreadNames, unreadPrefixes }) =>
  unreadNames.length === 0 && unreadPrefixes.length === 0
    ? 'gates.strayConfigs names no unread config files, so this gate would compare every file against an empty list. Declare `unreadNames` and/or `unreadPrefixes`, or drop the task.'
    : undefined;
