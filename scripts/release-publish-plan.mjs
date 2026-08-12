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

const REGISTRY =
  process.env.npm_config_registry ?? 'https://registry.npmjs.org';

/**
 * The registry's abbreviated packument for `name`, or `undefined` when the
 * package does not exist.
 *
 * Queried over HTTPS rather than by shelling out to `npm view`. Spawning `npm`
 * resolves a bare command name through `PATH`, which is a real concern in a job
 * that holds an OIDC token with publish rights (Sonar S4036) — and this is one
 * request per package instead of two, with no dependency on the CLI's output
 * format. The `install-v1` accept header asks for the small document: it carries
 * the `versions` map, which is both questions at once.
 *
 * A 404 is an answer, not an error — it is how "never published" presents. Any
 * *other* failure (an outage, a proxy) rethrows: an unreachable registry must
 * not read as "nothing is published", or every package would look publishable
 * and the job would walk into a publish it cannot complete.
 */
const fetchPackument = async (name) => {
  const response = await fetch(`${REGISTRY}/${name.replace('/', '%2f')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `registry lookup for ${name} failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

const classifyPackage = async ({ name, version }) => {
  const packument = await fetchPackument(name);

  return {
    localVersion: version,
    name,
    publishedVersion: packument?.['dist-tags']?.latest,
    state: classifyRelease({
      packageExists: packument !== undefined,
      versionExists: packument?.versions?.[version] !== undefined,
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

const main = async () => {
  const classified = await Promise.all(
    readPublishableManifests().map(classifyPackage),
  );
  const publishable = selectPublishable(classified);
  const firstPublish = selectFirstPublish(classified);

  console.log(renderSummary(classified));

  if (process.argv.includes('--github')) {
    writeGithub(classified, publishable, firstPublish);
  }
};

await main();
