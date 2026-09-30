/**
 * Which `@lcabrera/*` packages a created tree resolves, whether its declared
 * ranges admit the versions packed from this checkout, and whether the install
 * took every one of them from those tarballs rather than the registry
 * (verify-devkit-workspace.mjs).
 *
 * Pure: the CLI hands in manifests, YAML text and the lockfile.
 */

import semver from 'semver';
import { parse, parseAllDocuments, parseDocument } from 'yaml';

const SCOPE = '@lcabrera/';

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const CATALOG_PROTOCOL = 'catalog:';

const FILE_PROTOCOL = 'file:';

const declaredEntries = (manifest) =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {}),
  ).filter(([name]) => name.startsWith(SCOPE));

/**
 * @param {Record<string, unknown>} manifest
 * @returns {string[]}
 */
export const scopedNames = (manifest) => [
  ...new Set(declaredEntries(manifest).map(([name]) => name)),
];

/**
 * @param {{ manifestOf: (name: string) => Record<string, unknown> | undefined,
 *           roots: readonly string[] }} args
 * @returns {{ missing: string[], names: string[] }}
 */
export const packageClosure = ({ manifestOf, roots }) => {
  const seen = new Set();
  const missing = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const name = pending.pop();
    if (seen.has(name) || missing.has(name)) continue;
    const manifest = manifestOf(name);
    if (manifest === undefined) {
      missing.add(name);
      continue;
    }
    seen.add(name);
    pending.push(...scopedNames(manifest));
  }
  const byName = (left, right) => left.localeCompare(right);
  return {
    missing: [...missing].toSorted(byName),
    names: [...seen].toSorted(byName),
  };
};

/**
 * @param {readonly string[]} missing
 * @returns {string[]}
 */
export const missingPackageFindings = (missing) =>
  missing.map(
    (name) =>
      `the created tree resolves \`${name}\`, but no workspace in this checkout is named that, so there is no tarball to install it from and the install would take it from the registry`,
  );

/**
 * @param {string} workspaceYaml
 * @returns {Record<string, Record<string, string>>}
 */
export const catalogsOf = (workspaceYaml) => {
  const document = parse(workspaceYaml) ?? {};
  return {
    ...document.catalogs,
    ...(document.catalog === undefined ? {} : { default: document.catalog }),
  };
};

const resolvedRange = ({ catalogs, name, specifier }) => {
  if (!specifier.startsWith(CATALOG_PROTOCOL)) return specifier;
  const catalog = specifier.slice(CATALOG_PROTOCOL.length) || 'default';
  return catalogs[catalog]?.[name];
};

/**
 * @param {{ catalogs: Record<string, Record<string, string>>,
 *           manifests: ReadonlyArray<{ manifest: Record<string, unknown>, where: string }> }} args
 * @returns {Array<{ name: string, range: string | undefined, specifier: string, where: string }>}
 */
export const scopedDeclarations = ({ catalogs, manifests }) =>
  manifests.flatMap(({ manifest, where }) =>
    declaredEntries(manifest).map(([name, specifier]) => ({
      name,
      range: resolvedRange({ catalogs, name, specifier }),
      specifier,
      where,
    })),
  );

const rangeFinding = ({ declaration, version }) => {
  const { name, range, specifier, where } = declaration;
  if (range === undefined) {
    return `${where} declares \`${name}\` as \`${specifier}\`, which names no catalog entry, so the gate cannot tell whether the packed ${version} satisfies it`;
  }
  if (semver.validRange(range) === null) {
    return `${where} declares \`${name}\` as \`${range}\`, which is not a version range, so the gate cannot tell whether the packed ${version} satisfies it`;
  }
  if (semver.satisfies(version, range, { includePrerelease: true })) {
    return undefined;
  }
  return `${where} declares \`${name}\` as \`${range}\`, which the ${version} packed from this checkout does not satisfy — a consumer installing both from the registry would not get this version`;
};

/**
 * @param {{ declarations: ReadonlyArray<{ name: string, range: string | undefined,
 *                                          specifier: string, where: string }>,
 *           versions: ReadonlyMap<string, string> }} args
 * @returns {string[]}
 */
export const rangeFindings = ({ declarations, versions }) =>
  declarations
    .filter(({ name }) => versions.has(name))
    .map((declaration) =>
      rangeFinding({ declaration, version: versions.get(declaration.name) }),
    )
    .filter((finding) => finding !== undefined);

/**
 * @param {{ tarballs: ReadonlyMap<string, string>, workspaceYaml: string }} args
 * @returns {string}
 */
export const withTarballOverrides = ({ tarballs, workspaceYaml }) => {
  const document = parseDocument(workspaceYaml);
  for (const [name, tarball] of tarballs) {
    document.setIn(['overrides', name], `${FILE_PROTOCOL}${tarball}`);
  }
  return document.toString({ lineWidth: 0, singleQuote: true });
};

const packageNameOf = (key) => key.slice(0, key.indexOf('@', 1));

/**
 * @param {string} lockfile
 * @returns {string[]}
 */
export const registryResolvedFindings = (lockfile) =>
  parseAllDocuments(lockfile)
    .flatMap((document) => Object.entries(document.toJS()?.packages ?? {}))
    .filter(([key]) => key.startsWith(SCOPE))
    .filter(
      ([, entry]) =>
        !String(entry?.resolution?.tarball ?? '').startsWith(FILE_PROTOCOL),
    )
    .map(([key]) => packageNameOf(key))
    .map(
      (name) =>
        `\`${name}\` was installed from the registry, not from a tarball packed from this checkout, so the gate tested a published version rather than what the next release ships`,
    );
