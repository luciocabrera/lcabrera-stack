/**
 * The pure half of the published-manifest audit (audit-release.mjs).
 *
 * `repo-verify-publish` checks the tarball the source tree *would* produce,
 * packing with pnpm because `publishConfig.exports` substitution is a pnpm
 * extension (ADR-073). A defect that exists only in an `npm pack` tarball is
 * therefore invisible to it by construction — which is how a package once
 * reached npm uninstallable with every gate in its repository green (#730).
 * This module decides the same questions against the manifest a consumer would
 * actually receive.
 *
 * Two assertions, and they are not symmetric:
 *
 * - **An unsubstituted `catalog:`/`workspace:` range** is a defect in every
 *   package. Nothing legitimately publishes one; npm has no handler for either
 *   protocol and aborts at resolution with `EUNSUPPORTEDPROTOCOL`.
 * - **A `./src/` export target** is a defect only in a package the repository
 *   *builds*. A package may ship source on purpose — one whose identity is tied
 *   to its source path — so the classification comes from the same
 *   `isBuiltPublicPackage` predicate `repo-verify-publish` uses, and the two
 *   gates agree by construction rather than by two copies of a list.
 *
 * See ADR-077 for the version-coverage and blocking decisions this encodes.
 */

const SOURCE_PREFIX = './src/';

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const INSTALL_TIME_FIELDS = new Set([
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]);

const VERSION_COLLATOR = new Intl.Collator('en', { numeric: true });

export const compareVersions = (left, right) =>
  VERSION_COLLATOR.compare(left, right);

export const flattenExportTargets = (node, trail = []) => {
  if (typeof node === 'string') {
    return [{ target: node, trail }];
  }

  if (Array.isArray(node)) {
    return node.flatMap((entry, index) =>
      flattenExportTargets(entry, [...trail, String(index)]),
    );
  }

  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) =>
      flattenExportTargets(value, [...trail, key]),
    );
  }

  return [];
};

export const describeExportPath = (trail) => {
  const keys = trail.map((key) => `[${JSON.stringify(key)}]`).join('');

  return `exports${keys}`;
};

export const sourceExportProblems = (manifest) =>
  flattenExportTargets(manifest.exports)
    .filter(({ target }) => target.startsWith(SOURCE_PREFIX))
    .map(
      ({ target, trail }) =>
        `${describeExportPath(trail)} ships source: "${target}" — Node refuses to strip types inside node_modules`,
    );

export const hasLocalProtocol = (range) =>
  range.includes('catalog:') || range.includes('workspace:');

export const localProtocolProblems = (manifest) =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(
        ([, range]) => typeof range === 'string' && hasLocalProtocol(range),
      )
      .map(([name, range]) => {
        const consequence = INSTALL_TIME_FIELDS.has(field)
          ? ' — npm aborts the install with EUNSUPPORTEDPROTOCOL'
          : ' — an unsubstituted pnpm protocol';

        return `${field}["${name}"]: "${range}"${consequence}`;
      }),
  );

export const manifestProblems = ({ manifest, shipsSource }) => [
  ...(shipsSource ? [] : sourceExportProblems(manifest)),
  ...localProtocolProblems(manifest),
];

export const classifyAuditedVersion = ({ deprecated, problems, tags }) => {
  if (problems.length === 0) {
    return 'clean';
  }

  if (tags.length > 0) {
    return 'broken';
  }

  return deprecated ? 'deprecated' : 'broken';
};

export const auditVersion = ({ manifest, shipsSource, tags, version }) => {
  const deprecated = manifest.deprecated !== undefined;
  const problems = manifestProblems({ manifest, shipsSource });

  return {
    deprecated,
    problems,
    state: classifyAuditedVersion({ deprecated, problems, tags }),
    tags,
    version,
  };
};

export const tagsByVersion = (distTags = {}) =>
  Object.entries(distTags).reduce((byVersion, [tag, version]) => {
    byVersion.set(version, [...(byVersion.get(version) ?? []), tag]);

    return byVersion;
  }, new Map());

export const auditPackument = ({ only, packument, shipsSource }) => {
  const tags = tagsByVersion(packument['dist-tags']);

  return Object.entries(packument.versions ?? {})
    .filter(([version]) => only === undefined || only === version)
    .map(([version, manifest]) =>
      auditVersion({
        manifest,
        shipsSource,
        tags: tags.get(version) ?? [],
        version,
      }),
    )
    .sort((left, right) => compareVersions(left.version, right.version));
};

export const selectBroken = (audited) =>
  audited.flatMap(({ name, versions }) =>
    versions
      .filter(({ state }) => state === 'broken')
      .map(({ version }) => `${name}@${version}`),
  );

export const resolvedNothing = (audited) =>
  audited.length > 0 && audited.every(({ published }) => !published);

export const readNothing = ({ named, registry }) =>
  [
    `✗ ${registry} answered "not published" for every package asked about, so this run read nothing.`,
    named
      ? '  Either a name asked for is not on this registry, or the registry is not answering —'
      : '  Either nothing here has been published yet, or the registry is not answering —',
    '  a proxy, a wrong `npm_config_registry`, or an auth failure serving 404 rather than 401.',
    '  This audit does not report clean on a run that established nothing. See ADR-077.',
  ].join('\n');

const STATE_MARK = { broken: '✗', clean: '✓', deprecated: '⚠' };

const renderTags = (tags) => {
  const ordered = [...tags].sort((left, right) => left.localeCompare(right));

  return tags.length === 0 ? '' : ` (${ordered.join(', ')})`;
};

const renderVersion = ({ problems, state, tags, version }) => {
  const suffix = state === 'deprecated' ? ' — deprecated on the registry' : '';
  const head = `  ${STATE_MARK[state]} ${version}${renderTags(tags)}${suffix}`;

  return [head, ...problems.map((problem) => `      ${problem}`)];
};

const renderEmpty = (published) =>
  published ? '  — no such version on npm' : '  — not on npm';

const renderPackage = ({ name, published, versions }) =>
  versions.length === 0
    ? [name, renderEmpty(published)]
    : [name, ...versions.flatMap(renderVersion)];

export const renderAudit = ({ audited, registry }) =>
  [
    `Published manifest audit — ${registry}`,
    '',
    ...audited.flatMap((entry) => [...renderPackage(entry), '']),
  ].join('\n');
