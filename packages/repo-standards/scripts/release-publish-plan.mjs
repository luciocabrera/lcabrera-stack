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
 * Usage (from the repository root):
 *   repo-plan-release              # print the plan
 *   repo-plan-release --github     # + GITHUB_OUTPUT/SUMMARY
 *
 * It imports nothing outside `node:` builtins and this package, so a release
 * job can run it by path with plain `node` before installing the toolchain —
 * which is the point, since its answer decides whether installing is worth it.
 * Keep it that way: one dependency here turns a cheap pre-install check into a
 * full install.
 */

import { appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readPublishableManifests } from './publishable-workspaces.mjs';
import {
  classifyRelease,
  findBlockingFirstPublish,
  renderSummary,
  selectFirstPublish,
  selectPublishable,
} from './release-publishable.mjs';
import { fetchPackument } from './registry-packument.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

/** The name and version `changeset publish` would compare with the registry. */
const readReleaseTargets = () =>
  readPublishableManifests(REPO_ROOT).map(({ name, version }) => ({
    name,
    version,
  }));

/**
 * The abbreviated packument answers both questions at once — `dist-tags` for
 * what is current, `versions` for whether this one is already up. The failure
 * semantics that matter here (a 404 is "never published"; anything else
 * rethrows, so an outage never reads as "nothing is published") live in
 * `registry-packument.mjs`, shared with `audit-release.mjs`.
 */
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
    readReleaseTargets().map(classifyPackage),
  );
  const publishable = selectPublishable(classified);
  const firstPublish = selectFirstPublish(classified);
  const blocking = findBlockingFirstPublish({ firstPublish, publishable });

  console.log(renderSummary(classified));

  if (process.argv.includes('--github')) {
    writeGithub(classified, publishable, firstPublish);
  }

  if (blocking.length > 0) {
    const names = blocking.map(({ name }) => name).join(', ');

    console.error(
      `::error::Cannot release: ${names} has never been published, and \`changeset publish\` takes no package filter — it would try, fail with E404 under OIDC, and leave the packages published before it untagged. Publish it once by hand (or set \`private: true\` until then), then re-run.`,
    );
    process.exitCode = 1;
  }
};

await main();
