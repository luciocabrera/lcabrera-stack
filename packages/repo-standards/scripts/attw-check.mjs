/**
 * Runs Are The Types Wrong? over a built public package
 * (verify-attw.mjs).
 *
 * Answers a question the surface snapshot cannot: do the PUBLISHED types
 * actually resolve for a consumer? A subpath can have a perfectly stable surface
 * and still fail to resolve under a real project's module resolution — the
 * ESM/CJS and `.ts`-in-node_modules traps ADR-038 reasons about. The packages
 * this runs over are ESM-only, so the legacy `node10` and `node16-cjs` findings
 * attw emits are expected by design; only modern ESM / bundler resolution
 * reflects a consumer that could actually break.
 *
 * The installed layout is built from `dist` plus the `publishConfig` manifest —
 * exactly the substitution pnpm applies at pack time, which `repo-verify-publish`
 * independently validates — so no package manager subprocess is needed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { checkPackage, Package } from '@arethetypeswrong/core';

/**
 * Resolution modes a modern consumer actually uses. `node10` (legacy) and
 * `node16-cjs` (a CJS require of an ESM-only package) fail by design here and
 * are not the contract this gate protects.
 */
const RELEVANT_RESOLUTION_KINDS = new Set(['bundler', 'node16-esm']);

const listFilesRecursively = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFilesRecursively(path) : [path];
  });

/**
 * The package as a consumer would find it under `node_modules`: the manifest
 * with `publishConfig` merged in (pnpm's pack-time substitution) plus every
 * built file, keyed the way attw expects (`/node_modules/<name>/<path>`).
 */
const buildInstalledPackage = (packageDirectory) => {
  const manifest = JSON.parse(
    readFileSync(join(packageDirectory, 'package.json'), 'utf8'),
  );
  const { publishConfig = {}, ...base } = manifest;
  const published = { ...base, ...publishConfig };

  const root = `/node_modules/${manifest.name}`;
  const files = { [`${root}/package.json`]: JSON.stringify(published) };
  for (const file of listFilesRecursively(join(packageDirectory, 'dist'))) {
    files[`${root}/${relative(packageDirectory, file)}`] = readFileSync(
      file,
      'utf8',
    );
  }
  return new Package(files, manifest.name, manifest.version);
};

/** attw problems that reflect a break a modern consumer would actually hit. */
export const relevantProblems = (problems) =>
  problems.filter(
    (problem) =>
      problem.resolutionKind === undefined ||
      RELEVANT_RESOLUTION_KINDS.has(problem.resolutionKind),
  );

/** One human-readable line per problem, for the failure report. */
export const formatProblem = (problem) => {
  const at =
    problem.entrypoint === undefined ? '' : ` at ${problem.entrypoint}`;
  const mode =
    problem.resolutionKind === undefined ? '' : ` (${problem.resolutionKind})`;
  return `  ${problem.kind}${at}${mode}`;
};

/** Checks one built package; returns its name and the problems that matter. */
export const checkPackageTypes = async (packageDirectory) => {
  const analysis = await checkPackage(buildInstalledPackage(packageDirectory));
  return {
    problems: relevantProblems(analysis.problems ?? []),
  };
};
