/**
 * Cross-checks a surface change against the changesets in the PR
 * (verify-api-surface.mjs).
 *
 * A merged version bump publishes on its own, with no `private` flag between a
 * mistake and the npm registry (ADR-043). So a change to a package's published
 * surface must carry a changeset for THAT package: the gate names the exports
 * and classifies the change (a removal or signature change is breaking; a pure
 * addition is minor-safe), turning "did I break a consumer?" from a reviewer's
 * judgement into a mechanical check. Kept pure so `test:scripts` can cover the
 * frontmatter parsing and the requirement logic without a filesystem.
 */

const BUMP_LINE = /^\s*["']?(@[\w./-]+)["']?\s*:\s*(patch|minor|major)\s*$/;
const FRONTMATTER = /^---\n([\s\S]*?)\n---/;

/** Package names bumped by a single changeset file's frontmatter. */
export const parseChangesetBumps = (fileContent) => {
  const frontmatter = FRONTMATTER.exec(fileContent);
  if (frontmatter === null) {
    return [];
  }
  return frontmatter[1]
    .split('\n')
    .map((line) => BUMP_LINE.exec(line))
    .filter((match) => match !== null)
    .map((match) => match[1]);
};

/** Every package bumped across all changeset files. */
export const collectBumpedPackages = (fileContents) =>
  new Set(fileContents.flatMap((content) => parseChangesetBumps(content)));

/**
 * Given each changed package's classification and the bumped set, the packages
 * whose surface changed without a changeset. Breaking changes are always
 * required; a purely additive change is advisory (`required: false`) while the
 * packages are `0.x`, matching the changesets discipline without hard-failing a
 * legal minor. The caller decides how to surface each — fail vs warn.
 */
export const missingChangesets = ({ bumpedPackages, changedPackages }) =>
  changedPackages
    .filter(({ name }) => !bumpedPackages.has(name))
    .map(({ breaking, name }) => ({ breaking, name, required: breaking }));
