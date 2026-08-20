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

/** Owner, group or other — any of them is what git records as an executable file. */
const EXECUTABLE_BITS = 0o111;

/** Every file under `directory`, depth-first, in a stable order. */
const listFilesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFilesUnder(path) : [path];
    });

/**
 * The mode travels with the content, because a git hook that is not executable
 * is not a hook: git skips it without a word, which reads exactly like a hook
 * that ran and passed. Taken from the file rather than inferred from its group,
 * so a consumer receives what this package committed — npm and pnpm both keep
 * the bit through a pack.
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
