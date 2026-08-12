/**
 * Decide, per package, whether the Release workflow has anything to publish.
 *
 * This replaces a repo-wide "is any changeset pending?" gate that suppressed
 * publishing for **every** package whenever any one of them had an unconsumed
 * changeset (#620). That gate existed because `changesets/action` versions and
 * opens a PR when a changeset is pending; `changeset publish` — the CLI the
 * workflow actually wants — decides purely from `npm info` against the local
 * manifest version and never reads `.changeset/`. So the correct question is
 * about the registry, not the changeset folder, and it is answerable per
 * package.
 *
 * A package with its own pending changeset needs no special case: it has not
 * been versioned, so its manifest version is the one already on npm and it
 * classifies `up-to-date`.
 *
 * Pure — the npm queries and all output live in `scripts/release-publish-plan.mjs`.
 */

/** Column widths are irrelevant to the gate; this is the order rows render in. */
const STATE_ORDER = ['publish', 'first-publish', 'up-to-date'];

/**
 * `first-publish` is a **skip**, not a failure, and not something this workflow
 * can fix by trying harder: npm binds a trusted publisher to an existing
 * package, so a brand-new scoped name has nothing to attach the trust to and
 * fails with `E404` under OIDC (npm/cli#8976). Publishing it needs one manual
 * `npm publish`. Classifying it separately is what keeps the job green while
 * still saying, on the run summary, that a package is waiting for a human.
 */
export const classifyRelease = ({ packageExists, versionExists }) => {
  if (!packageExists) {
    return 'first-publish';
  }

  return versionExists ? 'up-to-date' : 'publish';
};

/** The packages `changeset publish` would actually publish. */
export const selectPublishable = (classified) =>
  classified.filter(({ state }) => state === 'publish');

/** The packages waiting on a manual first publish. */
export const selectFirstPublish = (classified) =>
  classified.filter(({ state }) => state === 'first-publish');

const STATE_LABEL = {
  'first-publish': '⏸ first publish — needs a manual `npm publish`',
  publish: '→ will publish',
  'up-to-date': '✓ already on npm',
};

const compareRows = (left, right) => {
  const byState =
    STATE_ORDER.indexOf(left.state) - STATE_ORDER.indexOf(right.state);

  return byState === 0 ? left.name.localeCompare(right.name) : byState;
};

/**
 * One version's section of a Changesets-generated `CHANGELOG.md`, for the body
 * of its GitHub Release.
 *
 * Dropping `changesets/action` (it cannot publish without also versioning, which
 * is what #620 is about) takes the release notes with it, so they are rebuilt
 * from the changelog the same action would have used. Falling back to an empty
 * string rather than throwing is deliberate: a missing section must not fail a
 * publish that has already reached npm and cannot be undone.
 */
export const extractChangelogSection = ({ changelog, version }) => {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);

  if (start === -1) {
    return '';
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));

  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
};

/**
 * A Markdown table for `$GITHUB_STEP_SUMMARY`, so a skipped publish is visible
 * on the run page without opening the log — the failure mode that let this
 * workflow report success through every push while publishing nothing.
 */
export const renderSummary = (classified) => {
  const rows = [...classified]
    .sort(compareRows)
    .map(
      ({ localVersion, name, publishedVersion, state }) =>
        `| \`${name}\` | ${localVersion} | ${publishedVersion ?? '—'} | ${STATE_LABEL[state]} |`,
    );

  return [
    '### Release plan',
    '',
    '| Package | Local | On npm | Outcome |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
};
