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
  { analyzer: 'fallow', directive: 'fallow-ignore-file', next: true },
];

const DIRECTIVE_PATTERN =
  /(?<![\w-])((?:eslint|oxlint)-disable(?:-next-line|-line)?|biome-ignore(?:-all|-start)?|react-doctor-disable(?:-next-line|-line)?|fallow-ignore-(?:next-line|file))(?![\w-])/u;

const BY_DIRECTIVE = new Map(
  DIRECTIVES.map((entry) => [entry.directive, entry]),
);

const CLAIM = /false positive|\bFP-\d/iu;

const EXPLANATION = /^false positive, case (FP-\d{4,}): (.*)/u;

const CASE_ID = /\bFP-\d{4,}\b/u;

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

const parseExplanation = (explanation) => {
  const match = EXPLANATION.exec(explanation);
  if (match === null) {
    return { caseId: CASE_ID.exec(explanation)?.[0], reason: '' };
  }
  return { caseId: match[1], reason: match[2].trim() };
};

const markerOn = ({ file, index, line }) => {
  const match = DIRECTIVE_PATTERN.exec(line);
  if (match === null || !opensComment(line.slice(0, match.index))) {
    return [];
  }
  const rest = line.slice(match.index + match[0].length);
  if (!CLAIM.test(rest)) return [];
  const { analyzer, directive, next } = BY_DIRECTIVE.get(match[1]);
  const { explanation, rule } = splitRest({ analyzer, rest });
  return [
    {
      analyzer,
      directive,
      file,
      line: index + 1,
      nextLine: next,
      rule,
      ...parseExplanation(explanation),
    },
  ];
};

export const findClaimedMarkers = ({ file, text }) =>
  text.split('\n').flatMap((line, index) => markerOn({ file, index, line }));

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
