/**
 * Renders a surface to its tracked snapshot text and parses it back
 * (verify-api-surface.mjs).
 *
 * The snapshot is a plain `.txt` golden file reviewed by diff, like the fallow
 * baselines. `.txt` on purpose: Oxfmt formats `.md`/`.json` and would reflow the
 * file on every run, the same churn trap the determinism note in issue #359
 * warns about. Kept pure and symmetrical so `render(parse(text)) === text`,
 * which `test:scripts` asserts.
 */

const HEADER_PREFIX = '# ';
const SUBPATH_PREFIX = '## ';

const headerLines = (packageName) => [
  `${HEADER_PREFIX}${packageName} — public API surface`,
  `${HEADER_PREFIX}Generated. Regenerate with: repo-verify-api-surface --write`,
  `${HEADER_PREFIX}One line per export: <name> <signature>. Do not edit by hand.`,
];

const renderExports = (subpathExports) =>
  Object.entries(subpathExports)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, signature]) => `${name} ${signature}`);

export const renderSurface = ({ packageName, surface }) => {
  const sections = Object.keys(surface)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((subpath) => [
      '',
      `${SUBPATH_PREFIX}${subpath}`,
      ...renderExports(surface[subpath]),
    ]);
  return `${[...headerLines(packageName), ...sections].join('\n')}\n`;
};

const isSubpathHeader = (line) => line.startsWith(SUBPATH_PREFIX);
const isComment = (line) => line.startsWith(HEADER_PREFIX);

export const parseSurface = (text) => {
  const surface = {};
  let current;
  for (const line of text.split('\n')) {
    if (line === '' || isComment(line)) {
      continue;
    }
    if (isSubpathHeader(line)) {
      current = line.slice(SUBPATH_PREFIX.length);
      surface[current] = {};
      continue;
    }
    const separator = line.indexOf(' ');
    const name = line.slice(0, separator);
    surface[current][name] = line.slice(separator + 1);
  }
  return surface;
};
