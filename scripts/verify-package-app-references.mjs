/**
 * Fails the build when a published package's documentation names an app.
 *
 * Usage: node scripts/verify-package-app-references.mjs
 *
 * Exit codes: 0 = no published package names an app, 1 = one does.
 */
import { existsSync, globSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appReferences,
  formatFinding,
  isCheckedDocument,
} from './lib/package-app-references.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const isPublished = (manifestPath) => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return manifest.private !== true;
};

const publishedPackageDirectories = () =>
  globSync('packages/*/package.json', { cwd: REPO_ROOT })
    .filter((relative) => isPublished(resolve(REPO_ROOT, relative)))
    .map((relative) => dirname(relative));

const documentsIn = (directory) =>
  globSync(`${directory}/**/*.md`, {
    cwd: REPO_ROOT,
    exclude: ['**/node_modules/**', '**/dist/**'],
  }).filter(isCheckedDocument);

const main = () => {
  const findings = publishedPackageDirectories()
    .flatMap(documentsIn)
    .flatMap((path) =>
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
    `Package reference gate passed: ${publishedPackageDirectories().length} published package(s) name no app.`,
  );
};

main();
