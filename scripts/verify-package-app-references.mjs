/**
 * Fails the build when a published package's documentation names an app.
 *
 * Usage: node scripts/verify-package-app-references.mjs
 *
 * Exit codes: 0 = no published package names an app, 1 = one does.
 */
import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appReferences,
  formatFinding,
  isCheckedFile,
} from './lib/package-app-references.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const isPublished = (manifestPath) => {
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')).private !== true;
  } catch (error) {
    throw new Error(`${manifestPath}: ${error.message}`);
  }
};

const publishedPackageDirectories = () =>
  globSync('packages/*/package.json', { cwd: REPO_ROOT })
    .filter((relative) => isPublished(resolve(REPO_ROOT, relative)))
    .map((relative) => dirname(relative));

const filesIn = (directory) =>
  globSync(`${directory}/**/*`, {
    cwd: REPO_ROOT,
    exclude: ['**/node_modules/**', '**/dist/**'],
  })
    .filter((path) => statSync(resolve(REPO_ROOT, path)).isFile())
    .filter(isCheckedFile);

const main = () => {
  const directories = publishedPackageDirectories();
  if (directories.length === 0) {
    throw new Error(
      'found no published packages under packages/ — check the glob.',
    );
  }
  const files = directories.flatMap(filesIn);
  if (files.length === 0) {
    throw new Error(
      'found no shipped text in any published package — check the glob.',
    );
  }
  const findings = files.flatMap((path) =>
    appReferences({
      exists: (reference) => existsSync(resolve(REPO_ROOT, reference)),
      path,
      text: readFileSync(resolve(REPO_ROOT, path), 'utf8'),
    }),
  );

  if (findings.length > 0) {
    console.error('Published packages must not reference apps:\n');
    for (const finding of findings) {
      console.error(`  - ${formatFinding(finding)}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Package reference gate passed: ${files.length} shipped file(s) across ` +
      `${directories.length} published package(s) name no app.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
