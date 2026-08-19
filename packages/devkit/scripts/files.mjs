/*
 * Reading a directory as the list of files a closure or a sync operates on.
 *
 * Paths come back relative to a root the caller names rather than absolute, so
 * a finding reads the same on every machine and in CI — an absolute path in a
 * report is noise a reader has to mentally strip before it means anything.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const toPosix = (path) => path.split(sep).join('/');

/** Every file under `directory`, depth-first, in a stable order. */
export const listFilesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFilesUnder(path) : [path];
    });

/**
 * @param {{ directory: string, root: string }} args
 * @returns {{ path: string, content: string }[]}
 */
export const readFilesUnder = ({ directory, root }) =>
  listFilesUnder(directory).map((path) => ({
    content: readFileSync(path, 'utf8'),
    path: toPosix(relative(root, path)),
  }));
