/**
 * Reads the inline markers that claim a panel-confirmed false positive, in the
 * spelling each analyzer accepts, and hashes the lines a marker covers. Pure:
 * `verify-suppressions.mjs` reads the files. The marker format and the panel
 * behind it are `docs/agents/public-package-suppressions.md`.
 */
import { createHash } from 'node:crypto';

import { opensComment } from './suppressions.mjs';

const DIRECTIVES = [
  { analyzer: 'eslint', directive: 'eslint-disable-next-line', next: true },
  { analyzer: 'eslint', directive: 'eslint-disable-line', next: false },
  { analyzer: 'eslint', directive: 'eslint-disable', next: false },
  { analyzer: 'oxlint', directive: 'oxlint-disable-next-line', next: true },
  { analyzer: 'oxlint', directive: 'oxlint-disable-line', next: false },
  { analyzer: 'oxlint', directive: 'oxlint-disable', next: false },
  { analyzer: 'biome', directive: 'biome-ignore-all', next: false },
  { analyzer: 'biome', directive: 'biome-ignore-start', next: false },
  { analyzer: 'biome', directive: 'biome-ignore', next: true },
  {
    analyzer: 'react-doctor',
    directive: 'react-doctor-disable-next-line',
    next: true,
  },
  {
    analyzer: 'react-doctor',
    directive: 'react-doctor-disable-line',
    next: false,
  },
  { analyzer: 'react-doctor', directive: 'react-doctor-disable', next: false },
  { analyzer: 'fallow', directive: 'fallow-ignore-next-line', next: true },
  { analyzer: 'fallow', directive: 'fallow-ignore-file', next: false },
];

const DIRECTIVE_TOKEN = /(?:eslint|oxlint|biome|react-doctor|fallow)-[a-z-]+/gu;

const BY_DIRECTIVE = new Map(
  DIRECTIVES.map((entry) => [entry.directive, entry]),
);

const CLAIM = /^false positive, case (FP-\d{4,}):(.*)/u;

const splitRest = ({ analyzer, rest }) => {
  const end = rest.indexOf('*/');
  const body = (end === -1 ? rest : rest.slice(0, end)).trim();
  const separator = analyzer === 'biome' ? ':' : ' -- ';
  const [rule, ...explanation] = body.split(separator);
  return {
    explanation: explanation.join(separator).trim(),
    rule: rule.trim(),
  };
};

const tokensOn = (line) =>
  [...line.matchAll(DIRECTIVE_TOKEN)].map((match) => ({
    entry: BY_DIRECTIVE.get(match[0]),
    index: match.index,
    joined: /[\w-]/u.test(line.charAt(match.index - 1)),
    length: match[0].length,
  }));

const markerAt = ({ file, index, line, next, token }) => {
  const rest = line.slice(token.index + token.length, next);
  const { explanation, rule } = splitRest({
    analyzer: token.entry.analyzer,
    rest,
  });
  const claim = CLAIM.exec(explanation);
  if (claim === null) return [];
  const { analyzer, directive, next: nextLine } = token.entry;
  return [
    {
      analyzer,
      caseId: claim[1],
      column: token.index,
      directive,
      file,
      line: index + 1,
      nextLine,
      reason: claim[2].trim(),
      rule,
    },
  ];
};

const markersOn = ({ file, index, line }) => {
  const tokens = tokensOn(line);
  return tokens.flatMap((token, position) =>
    token.entry === undefined ||
    token.joined ||
    !opensComment({ index: token.index, line })
      ? []
      : markerAt({
          file,
          index,
          line,
          next: tokens[position + 1]?.index,
          token,
        }),
  );
};

export const findClaimedMarkers = ({ file, text }) =>
  text.split('\n').flatMap((line, index) => markersOn({ file, index, line }));

export const hashLines = (lines) =>
  createHash('sha256').update(lines.join('\n')).digest('hex');

export const coveredLines = ({ line, lines, text }) =>
  text.split('\n').slice(line, line + lines);

const NEXT_LINE_DIRECTIVES = {
  biome: 'biome-ignore',
  eslint: 'eslint-disable-next-line',
  fallow: 'fallow-ignore-next-line',
  oxlint: 'oxlint-disable-next-line',
  'react-doctor': 'react-doctor-disable-next-line',
};

export const markerSpelling = ({ analyzer, caseId, reason, rule }) => {
  const explanation = `false positive, case ${caseId}: ${reason}`;
  const directive = NEXT_LINE_DIRECTIVES[analyzer];
  return analyzer === 'biome'
    ? `// ${directive} ${rule}: ${explanation}`
    : `// ${directive} ${rule} -- ${explanation}`;
};
