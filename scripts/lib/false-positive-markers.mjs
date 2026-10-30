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

const escaped = (text) =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

const DIRECTIVE_PATTERN = new RegExp(
  `(?<![\\w-])(${DIRECTIVES.map(({ directive }) => escaped(directive)).join('|')})(?![\\w-])`,
  'u',
);

const BY_DIRECTIVE = new Map(
  DIRECTIVES.map((entry) => [entry.directive, entry]),
);

const CLAIM = /false positive|\bFP-\d/iu;

const EXPLANATION = /^false positive, case (FP-\d{4,}): (.*)$/u;

const CASE_ID = /\bFP-\d{4,}\b/u;

const COMMENT_END = /\s*\*\/\s*\}?\s*$/u;

const splitRest = ({ analyzer, rest }) => {
  const body = rest.replace(COMMENT_END, '').trim();
  if (analyzer === 'biome') {
    const colon = body.indexOf(':');
    return colon === -1
      ? { explanation: '', rule: body }
      : {
          explanation: body.slice(colon + 1).trim(),
          rule: body.slice(0, colon).trim(),
        };
  }
  const [rule = '', ...explanation] = body.split(' -- ');
  return { explanation: explanation.join(' -- ').trim(), rule: rule.trim() };
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

export const markerSpelling = ({ analyzer, caseId, reason, rule }) => {
  const explanation = `false positive, case ${caseId}: ${reason}`;
  const directive = DIRECTIVES.find(
    (entry) => entry.analyzer === analyzer && entry.next,
  )?.directive;
  return analyzer === 'biome'
    ? `// ${directive} ${rule}: ${explanation}`
    : `// ${directive} ${rule} -- ${explanation}`;
};
