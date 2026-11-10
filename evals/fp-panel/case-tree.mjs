/**
 * Reads an fp-panel fixture's files and lays them out as the tree a panel
 * seat reads: each `.fixture` file under its real name, and the case file
 * where `vp run adjudicate` would put it. The files carry the suffix so the
 * repository's own analyzers never read a fixture's planted finding.
 * Usage: imported by `verify-fp-panel.mjs`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { treePathOf } from './fp-panel.mjs';

const posix = (path) => path.replaceAll('\\', '/');

export const readFixtureTree = (directory) => {
  const root = posix(directory);
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => posix(join(entry.parentPath, entry.name)))
      .map((path) => [path, treePathOf(path.slice(root.length + 1))])
      .filter(([, treePath]) => treePath !== undefined)
      .map(([path, treePath]) => [treePath, readFileSync(path, 'utf8')])
      .toSorted(([left], [right]) => left.localeCompare(right)),
  );
};

const writeInto = ({ into, path, text }) => {
  const target = join(into, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
};

export const writeCaseTree = ({ caseFile, casePath, files, into }) => {
  for (const [path, text] of Object.entries(files)) {
    writeInto({ into, path, text });
  }
  writeInto({
    into,
    path: casePath,
    text: `${JSON.stringify(caseFile, null, 2)}\n`,
  });
};
