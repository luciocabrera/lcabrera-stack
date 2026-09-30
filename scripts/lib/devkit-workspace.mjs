/**
 * Deciding whether a tree `devkit create --profile monorepo` made from the
 * packed tarball is one its own tasks accept (verify-devkit-workspace.mjs).
 *
 * Pure: the CLI hands in versions, path lists and process results.
 */

import semver from 'semver';

const OUTPUT_TAIL_LINES = 40;

/**
 * @type {ReadonlyArray<readonly string[]>}
 */
export const TREE_TASKS = [
  ['run', 'lint:check'],
  ['run', 'typecheck:all'],
  ['fmt', '--check', '.'],
  ['run', 'test:all'],
  ['run', 'lint:all'],
];

/**
 * @param {readonly string[]} args
 * @returns {string}
 */
export const commandLabel = (args) => ['vp', ...args].join(' ');

/**
 * @param {string} output
 * @returns {string}
 */
export const outputTail = (output) => {
  const lines = output.split('\n').filter((line) => line.trim() !== '');
  return lines.length === 0
    ? 'no output'
    : lines.slice(-OUTPUT_TAIL_LINES).join('\n');
};

/**
 * @param {{ band?: string, pinned?: string, running: string }} args
 * @returns {string[]}
 */
export const nodeFindings = ({ band, pinned, running }) => {
  if (band === undefined || pinned === undefined) {
    return [
      'the created tree declares no `engines.node` band or no `.node-version`, so nothing in it names the runtime its install needs',
    ];
  }
  if (semver.satisfies(running, band)) return [];
  return [
    `the created tree pins Node ${pinned} and its \`engineStrict\` install refuses anything outside \`${band}\`, but this run is on Node ${running}. That refusal is the tree working, not the gate breaking: run the gate on the Node the tree's \`.node-version\` names.`,
  ];
};

const outcomeOf = ({ error, signal, status }) => {
  if (error !== undefined) return `could not run (${error})`;
  if (signal !== undefined && signal !== null) return `was killed by ${signal}`;
  return `exited ${status}`;
};

/**
 * @param {{ error?: string, label: string, output: string,
 *           signal?: string | null, status: number | null }} result
 * @returns {string[]}
 */
export const taskFindings = ({ error, label, output, signal, status }) => {
  if (error === undefined && status === 0) return [];
  const outcome = outcomeOf({ error, signal, status });
  return [
    `\`${label}\` ${outcome} in the created tree:\n${outputTail(output)}`,
  ];
};

/**
 * @param {string} porcelain
 * @returns {string[]}
 */
export const modifiedTrackedFiles = (porcelain) =>
  porcelain
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.slice(3))
    .map(
      (path) =>
        `\`${path}\` changed while the gate ran — a task rewrote a file the blueprint shipped, so a consumer's fresh tree goes dirty the first time they run it`,
    );

/**
 * @param {{ blueprint: readonly string[], placed: readonly string[],
 *           targetOf: (path: string) => string | undefined }} args
 * @returns {string[]}
 */
export const missingBlueprintFiles = ({ blueprint, placed, targetOf }) => {
  const present = new Set(placed);
  return blueprint
    .filter((path) => !present.has(targetOf(path) ?? path))
    .map(
      (path) =>
        `the blueprint's \`${path}\` never reached the created tree — the packed tarball does not carry it, so a consumer's \`devkit create\` would not place it either`,
    );
};
