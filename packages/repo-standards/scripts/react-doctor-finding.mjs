/**
 * Pure core of the React Doctor gate (`./verify-react-doctor.mjs`): which
 * findings block, which config files would shadow `doctor.config.jsonc`, and
 * how one blocking finding prints.
 *
 * `blocking` takes the CLI's own values and its default, `error`. The loader
 * prefers every name in `SHADOWING_CONFIGS` over the `.jsonc`, so one present
 * means the scan ran on rules the gate never read.
 *
 * A finding's `id` may be a string, `null` or missing; only a string names the
 * repository path, otherwise the normalized file path stands in.
 */

const BLOCKING_SEVERITIES = new Map([
  ['error', new Set(['error'])],
  ['none', new Set()],
  ['warning', new Set(['error', 'warning'])],
]);

export const SHADOWING_CONFIGS = [
  'doctor.config.ts',
  'doctor.config.mts',
  'doctor.config.cts',
  'doctor.config.js',
  'doctor.config.mjs',
  'doctor.config.cjs',
  'doctor.config.json',
];

export const blockingSeverities = (config) => {
  const level = config?.blocking ?? 'error';
  const severities = BLOCKING_SEVERITIES.get(level);
  if (severities === undefined)
    throw new Error(
      `"blocking": ${JSON.stringify(level)} is not one of ` +
        `${BLOCKING_SEVERITIES.keys().toArray().join(', ')}.`,
    );
  return { level, severities };
};

export const blockingFindings = (diagnostics, severities) =>
  diagnostics.filter((finding) => severities.has(finding.severity));

export const findShadowingConfigs = (exists) =>
  SHADOWING_CONFIGS.filter((name) => exists(name));

export const renderFinding = ({
  id,
  line,
  message,
  normalizedFilePath,
  rule,
  severity,
}) => {
  const [repoPath] = typeof id === 'string' ? id.split('::', 1) : [];
  const label = severity === undefined ? rule : `${rule} (${severity})`;
  return `  ${repoPath || normalizedFilePath}:${line}  ${label}\n      ${message}`;
};
