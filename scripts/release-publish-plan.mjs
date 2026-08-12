/**
 * Answer "does the Release workflow have anything to publish?" per package,
 * by asking the registry rather than counting files in `.changeset/`.
 *
 * Why this exists: the previous gate counted pending changesets repo-wide and
 * skipped every publish step when the count was non-zero (#620). Because
 * changesets accumulate continuously in a repo several agents work in, that
 * count is essentially never zero, so the workflow reported success through
 * every push to `main` while publishing nothing — a green run that was not
 * evidence of anything. It also made an independent per-package release
 * impossible, even though nothing in the dependency graph couples the packages.
 *
 * The gate is deliberately **permissive**: `changeset publish` remains the
 * authority on what ships, and anything this script cannot resolve is reported
 * as publishable so the workflow proceeds and lets the real tool decide. It may
 * over-report and waste a build; it must never under-report and silently skip a
 * release.
 *
 * Usage (from the repo root):
 *   node scripts/release-publish-plan.mjs            # print the plan
 *   node scripts/release-publish-plan.mjs --github   # + GITHUB_OUTPUT/SUMMARY
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyRelease,
  renderSummary,
  selectFirstPublish,
  selectPublishable,
} from './lib/release-publishable.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/**
 * Both workspace roots, because `changeset publish` filters on `private`
 * alone — not on a directory. Scanning only `packages/` would miss a
 * non-private app and under-report, which is the one direction this must not
 * fail in.
 */
const WORKSPACE_DIRS = ['apps', 'packages'];

/** Every workspace manifest `changeset publish` would consider. */
const readPublishableManifests = () =>
  WORKSPACE_DIRS.flatMap((workspaceDir) => {
    const root = join(REPO_ROOT, workspaceDir);

    return existsSync(root)
      ? readdirSync(root).map((name) => join(root, name, 'package.json'))
      : [];
  })
    .filter((manifestPath) => existsSync(manifestPath))
    .map((manifestPath) => JSON.parse(readFileSync(manifestPath, 'utf8')))
    .filter((manifest) => manifest.private !== true && manifest.name)
    .map(({ name, version }) => ({ name, version }));

/**
 * `npm view <spec> version`, or `undefined` when the spec does not exist.
 *
 * A 404 is the answer, not an error — it is how "never published" and "this
 * version is not published" both present. Any *other* failure (a registry
 * outage, a proxy) must not read as "not published", or an unreachable npm
 * would make every package look publishable and send the job into a publish it
 * cannot complete. Those rethrow.
 */
const viewVersion = (spec) => {
  try {
    return (
      execFileSync('npm', ['view', spec, 'version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim() || undefined
    );
  } catch (error) {
    const stderr = String(error.stderr ?? '');

    if (stderr.includes('E404') || stderr.includes('404 Not Found')) {
      return undefined;
    }

    throw new Error(
      `npm view ${spec} failed: ${stderr.trim() || error.message}`,
    );
  }
};

const classifyPackage = ({ name, version }) => {
  const publishedVersion = viewVersion(name);

  return {
    localVersion: version,
    name,
    publishedVersion,
    state: classifyRelease({
      packageExists: publishedVersion !== undefined,
      versionExists: viewVersion(`${name}@${version}`) !== undefined,
    }),
  };
};

const writeGithub = (classified, publishable, firstPublish) => {
  const { GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;

  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `count=${publishable.length}\n`);
  }

  if (GITHUB_STEP_SUMMARY) {
    appendFileSync(GITHUB_STEP_SUMMARY, renderSummary(classified));
  }

  for (const { localVersion, name } of firstPublish) {
    console.log(
      `::warning::${name}@${localVersion} has never been published. A scoped first publish cannot use OIDC trusted publishing (npm/cli#8976) — publish it once by hand, then configure its trusted publisher.`,
    );
  }

  if (publishable.length === 0) {
    console.log('::notice::Nothing to publish — every version is on npm.');
  }
};

const main = () => {
  const classified = readPublishableManifests().map(classifyPackage);
  const publishable = selectPublishable(classified);
  const firstPublish = selectFirstPublish(classified);

  console.log(renderSummary(classified));

  if (process.argv.includes('--github')) {
    writeGithub(classified, publishable, firstPublish);
  }
};

main();
