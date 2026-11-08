/**
 * Reads the inline markers that claim a panel-confirmed false positive, in the
 * spelling each analyzer accepts, and hashes the lines a marker covers. Pure:
 * `verify-suppressions.mjs` reads the files. The marker format and the panel
 * behind it are `docs/agents/public-package-suppressions.md`.
 */
import { createHash } from 'node:crypto';

import { CLAIM } from './case-id.mjs';
import { findCommentDirectives } from './comment-directives.mjs';

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

const markerFrom = ({ column, file, line, rest, token }) => {
  const entry = BY_DIRECTIVE.get(token);
  if (entry === undefined) return [];
  const { explanation, rule } = splitRest({ analyzer: entry.analyzer, rest });
  const claim = CLAIM.exec(explanation);
  return claim === null
    ? []
    : [
        {
          analyzer: entry.analyzer,
          caseId: claim[1],
          column,
          directive: entry.directive,
          file,
          line,
          nextLine: entry.next,
          reason: claim[2].trim(),
          rule,
        },
      ];
};

export const findClaimedMarkers = ({ file, text }) =>
  findCommentDirectives({ file, pattern: DIRECTIVE_TOKEN, text }).flatMap(
    (found) => markerFrom({ ...found, file }),
  );

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
