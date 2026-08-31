/*
 * Reading a directory as the list of files a closure or a sync operates on.
 *
 * Paths come back relative to a root the caller names rather than absolute, so
 * a finding reads the same on every machine and in CI — an absolute path in a
 * report is noise a reader has to mentally strip before it means anything.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const toPosix = (path) => path.split(sep).join('/');

const EXECUTABLE_BITS = 0o111;

const listFilesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFilesUnder(path) : [path];
    });

/**
 * The mode is reported beside the content, because a git hook that is not
 * executable is not a hook: git skips it without a word, which reads exactly
 * like a hook that ran and passed.
 *
 * What is reported here is what is on disk — the honest answer for a general
 * file reader, and the wrong one for deciding what a consumer receives.
 * `pnpm pack` writes every entry 0644, so an installed copy of this package
 * holds no executable file at all. Callers materialising shipped assets take
 * the mode from `isExecutableAsset` instead. This claimed to be the source of
 * truth for that, and was believed for as long as nothing installed the package.
 *
 * @param {{ directory: string, root: string }} args
 * @returns {{ path: string, content: string, executable: boolean }[]}
 */
export const readFilesUnder = ({ directory, root }) =>
  listFilesUnder(directory).map((path) => ({
    content: readFileSync(path, 'utf8'),
    executable: (statSync(path).mode & EXECUTABLE_BITS) !== 0,
    path: toPosix(relative(root, path)),
  }));
