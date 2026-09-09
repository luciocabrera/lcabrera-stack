/**
 * Reading the tree `devkit` produced inside the scratch consumer
 * (verify-devkit-tarball.mjs), so the CLI stays under the script-size ceiling.
 *
 * Everything here walks that directory and hands what it read to a pure decider
 * in `./devkit-tarball.mjs`. Only the produced tree can answer these questions:
 * a file's mode, an unresolved placeholder and a workspace specifier all read
 * correctly in the source assets and wrongly in the copy an installer gets.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  foreignSpecifiers,
  materialisationFailure,
} from './devkit-tarball.mjs';

const EXECUTABLE_BITS = 0o111;

const PLACEHOLDER = '{{commands.';

const MANIFEST_FILE = '.devkit-manifest.json';

const toPosix = (value) => value.replaceAll('\\', '/');

/**
 * @param {string} directory
 * @returns {string[]} every file under it, `node_modules` and `.git` aside
 */
const materialisedFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? materialisedFiles(path) : [path];
  });

/**
 * @param {string} consumer
 * @returns {{ executable: boolean, path: string }[]}
 */
export const materialisedModes = (consumer) =>
  materialisedFiles(consumer).map((path) => ({
    executable: (statSync(path).mode & EXECUTABLE_BITS) !== 0,
    path: toPosix(relative(consumer, path)),
  }));

/**
 * @param {string} consumer
 * @returns {string[]}
 */
export const materialisedFailure = (consumer) => {
  const manifestPath = join(consumer, MANIFEST_FILE);
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};
  const failure = materialisationFailure({
    manifestFiles: manifest.files,
    presentPaths: materialisedFiles(consumer).map((path) =>
      toPosix(relative(consumer, path)),
    ),
  });
  return failure === undefined ? [] : [failure];
};

/**
 * @param {string} consumer
 * @returns {string[]}
 */
export const survivingPlaceholders = (consumer) =>
  materialisedFiles(consumer)
    .filter((path) => readFileSync(path, 'utf8').includes(PLACEHOLDER))
    .map(
      (path) =>
        `\`${toPosix(relative(consumer, path))}\` still carries a {{commands.*}} placeholder`,
    );

/**
 * @param {string} consumer
 * @returns {string[]}
 */
export const specifierFindings = (consumer) =>
  foreignSpecifiers({
    materialised: materialisedFiles(consumer).map((path) => ({
      content: readFileSync(path, 'utf8'),
      path: toPosix(relative(consumer, path)),
    })),
  });
