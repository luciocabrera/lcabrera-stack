/**
 * Decide, per package, whether the Release workflow has anything to publish.
 *
 * This replaces a repo-wide "is any changeset pending?" gate that suppressed
 * publishing for **every** package whenever any one of them had an unconsumed
 * changeset (#620). That gate existed because `changesets/action` versions and
 * opens a PR when a changeset is pending; `changeset publish` — the CLI the
 * workflow actually wants — decides purely from `npm info` against the local
 * manifest version. It reads `.changeset/config.json` (for `access`,
 * `privatePackages`) but never the pending changeset *files*, so the correct
 * question is about the registry, not about what is queued, and it is
 * answerable per package.
 *
 * A package with its own pending changeset needs no special case: it has not
 * been versioned, so its manifest version is the one already on npm and it
 * classifies `up-to-date`.
 *
 * Pure — the npm queries and all output live in `release-publish-plan.mjs`.
 */

/** Column widths are irrelevant to the gate; this is the order rows render in. */
const STATE_ORDER = ['publish', 'first-publish', 'up-to-date'];

export const classifyRelease = ({ packageExists, versionExists }) => {
  if (!packageExists) {
    return 'first-publish';
  }

  return versionExists ? 'up-to-date' : 'publish';
};

export const selectPublishable = (classified) =>
  classified.filter(({ state }) => state === 'publish');

export const selectFirstPublish = (classified) =>
  classified.filter(({ state }) => state === 'first-publish');

export const findBlockingFirstPublish = ({ firstPublish, publishable }) =>
  publishable.length > 0 ? firstPublish : [];

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
