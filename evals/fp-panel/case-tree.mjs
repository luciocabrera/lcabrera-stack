/**
 * Reads an fp-panel fixture's files and lays them out as the tree a panel
 * seat reads: each `.fixture` file under its real name, and the case file
 * where `vp run adjudicate` would put it. The files carry the suffix so the
 * repository's own analyzers never read a fixture's planted finding.
 * Usage: imported by `verify-fp-panel.mjs`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { treePathOf } from './fp-panel.mjs';

export const readFixtureTree = (directory) =>
  Object.fromEntries(
    readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .map((path) => [path, treePathOf(relative(directory, path))])
      .filter(([, treePath]) => treePath !== undefined)
      .map(([path, treePath]) => [treePath, readFileSync(path, 'utf8')])
      .toSorted(([left], [right]) => left.localeCompare(right)),
  );

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
