/**
 * Deciding whether every file `packages/devkit` ships has a row in its
 * classification, and whether every path a row names still ships.
 *
 * A row is keyed to shipped files by the backticked tokens in its first cell
 * that contain a slash: a path or glob relative to the assets directory. A
 * token with no slash names a file in this repository, not a shipped one. Pure,
 * so the verifier beside it does the reading and the printing.
 */

const TOKEN = /`([^`]+)`/g;

const REGEX_SPECIAL = /[$()+.?[\\\]^{|}]/g;

const firstCell = (line) => line.split('|')[1] ?? '';

const isTableRow = (line) => line.startsWith('|');

/**
 * @param {string} markdown
 * @returns {string[]} the asset paths and globs named in the first cell of
 * every table row
 */
export const assetPatternsIn = (markdown) =>
  markdown
    .split('\n')
    .filter((line) => isTableRow(line))
    .flatMap((line) => [...firstCell(line).matchAll(TOKEN)])
    .map((match) => match[1])
    .filter((token) => token.includes('/'));

const segmentSource = (segment) =>
  segment.replaceAll(REGEX_SPECIAL, String.raw`\$&`).replaceAll('*', '[^/]*');

const globSource = (pattern) =>
  pattern
    .split('/')
    .map((segment, index, segments) => {
      if (segment !== '**') return segmentSource(segment);
      return index === segments.length - 1 ? '.*' : '(?:.*/)?';
    })
    .join('/')
    .replaceAll('(?:.*/)?/', '(?:.*/)?');

/**
 * @param {string} pattern a path or glob; `*` stays inside one segment, `**`
 * spans any number of them
 * @returns {(path: string) => boolean}
 */
export const assetMatcher = (pattern) => {
  const expression = new RegExp(`^${globSource(pattern)}$`, 'u');
  return (path) => expression.test(path);
};

/**
 * @param {{ assets: readonly string[], patterns: readonly string[] }} args
 * @returns {{ stale: string[], uncovered: string[] }} the shipped files no row
 * names, and the row tokens that name no shipped file
 */
export const coverageReport = ({ assets, patterns }) => {
  const matchers = patterns.map((pattern) => ({
    matches: assetMatcher(pattern),
    pattern,
  }));
  return {
    stale: matchers
      .filter(({ matches }) => !assets.some((path) => matches(path)))
      .map(({ pattern }) => pattern),
    uncovered: assets.filter(
      (path) => !matchers.some(({ matches }) => matches(path)),
    ),
  };
};
