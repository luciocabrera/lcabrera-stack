/**
 * Rewriting the runtime pins `devkit` emits so they match the root's.
 *
 * The constants in `workspace.mjs` are copies of `.node-version` and the root
 * `packageManager`, because a repository being created has nothing to read them
 * from. A copy nothing moves falls behind on the next refresh (#1179).
 */

const NODE_PIN = /(export const NODE_VERSION =\s*')[^']*(')/u;

const PACKAGE_MANAGER_PIN = /(export const PACKAGE_MANAGER =\s*')[^']*(')/u;

const rewrite = ({ label, pattern, source, value }) => {
  if (!pattern.test(source)) {
    throw new Error(
      `devkit-pins: no \`${label}\` constant found to rewrite — the declaration moved or was renamed`,
    );
  }
  return source.replace(pattern, `$1${value}$2`);
};

/**
 * The `workspace.mjs` source with both pins set to the values given.
 *
 * @param {{ nodeVersion: string, packageManager: string, source: string }} args
 * @returns {string}
 */
export const withEmittedPins = ({ nodeVersion, packageManager, source }) =>
  rewrite({
    label: 'PACKAGE_MANAGER',
    pattern: PACKAGE_MANAGER_PIN,
    source: rewrite({
      label: 'NODE_VERSION',
      pattern: NODE_PIN,
      source,
      value: nodeVersion,
    }),
    value: packageManager,
  });
