/**
 * Builds the case file a false-positive panel reads: the finding as the
 * analyzer reports it, the analyzer's own explanation and trace where it has
 * them, and the flagged code. It takes no free text, so nothing the builder
 * argued can reach the panel. Pure: `scripts/adjudicate.mjs` runs the tools.
 */
import { CASE_FILE } from './case-id.mjs';
import { hashLines } from './false-positive-markers.mjs';

const LINE_RANGE = /^(\d+)(?:-(\d+))?$/u;

const RULE_NAME = /^[\w@][\w@/:.-]*$/u;

const isRepoRelative = (file) =>
  !file.startsWith('-') &&
  !file.includes('\\') &&
  file.split('/').every((segment) => !['', '.', '..'].includes(segment));

const CONTEXT_LINES = 10;

export const ADJUDICATED_ANALYZERS = [
  'biome',
  'eslint',
  'fallow',
  'oxlint',
  'react-doctor',
];

const splitFindingId = (findingId) => {
  const parts = String(findingId).split(':');
  const at = parts.findIndex(
    (part, index) =>
      index !== 0 && index !== parts.length - 1 && LINE_RANGE.test(part),
  );
  if (at === -1) return;
  const [, start, end = start] = LINE_RANGE.exec(parts[at]);
  return {
    end: Number(end),
    file: parts.slice(0, at).join(':'),
    rule: parts.slice(at + 1).join(':'),
    start: Number(start),
  };
};

const HEALTH_EXCEEDED = {
  'high-complexity': 'both',
  'high-crap-score': 'crap',
  'high-cyclomatic-complexity': 'cyclomatic',
  'high-cognitive-complexity': 'cognitive',
};

export const fallowScope = ({ command, id, result_key: resultKey }) => {
  if (resultKey) return { section: resultKey };
  if (command === 'dupes') return { section: 'clone_groups' };
  if (command === 'security') {
    return {
      matches: [
        ['category', id],
        ['kind', id],
      ],
      section: 'security_findings',
    };
  }
  const exceeded = HEALTH_EXCEEDED[id];
  if (command === 'health' && exceeded !== undefined) {
    return { matches: [['exceeded', exceeded]], section: 'findings' };
  }
};

export const parseFindingId = (findingId) => {
  const parsed = splitFindingId(findingId);
  if (parsed === undefined) {
    throw new Error(
      `the finding id "${findingId}" is not <file>:<line>[-<end line>]:<rule>`,
    );
  }
  if (parsed.start < 1 || parsed.end < parsed.start) {
    throw new Error(`the finding id "${findingId}" names no line range`);
  }
  if (!RULE_NAME.test(parsed.rule)) {
    throw new Error(`the finding id "${findingId}" names no rule`);
  }
  if (!isRepoRelative(parsed.file)) {
    throw new Error(
      `the finding id "${findingId}" names no repository-relative file`,
    );
  }
  return parsed;
};

export const takenCaseNames = ({ committed, local }) => [
  ...local,
  ...committed.map((path) => path.split('/').at(-1)),
];

export const nextCaseId = (names) => {
  const highest = Math.max(
    0,
    ...names.flatMap((name) => {
      const match = CASE_FILE.exec(name);
      return match === null ? [] : [Number(match[1])];
    }),
  );
  return `FP-${String(highest + 1).padStart(4, '0')}`;
};

const PLUGIN_RULE = /^([\w@/-]+)\(([^()]+)\)$/u;

const ruleNames = (value) => {
  const strings = Object.values(value).filter(
    (field) => typeof field === 'string',
  );
  const wrapped = strings.flatMap((field) => {
    const match = PLUGIN_RULE.exec(field);
    return match === null ? [] : [match[2], `${match[1]}/${match[2]}`];
  });
  const split =
    typeof value.plugin === 'string' && typeof value.rule === 'string'
      ? [`${value.plugin}/${value.rule}`]
      : [];
  return [...strings, ...wrapped, ...split];
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const namesFile = ({ file, value }) =>
  Object.values(value).some(
    (field) =>
      typeof field === 'string' &&
      (field === file || field.endsWith(`/${file}`)),
  );

const lineNumbers = (value) =>
  Object.entries(value).flatMap(([key, field]) => {
    if (typeof field === 'number' && /line/iu.test(key)) return [field];
    if (Array.isArray(field)) {
      return field.filter((item) => isPlainObject(item)).flatMap(lineNumbers);
    }
    return isPlainObject(field) ? lineNumbers(field) : [];
  });

const childObjects = (value) =>
  Object.entries(value).flatMap(([key, field]) => {
    if (Array.isArray(field)) {
      return field
        .filter((item) => isPlainObject(item))
        .map((item) => ({ inArray: true, key, value: item }));
    }
    return isPlainObject(field) ? [{ inArray: false, key, value: field }] : [];
  });

const namesFileWithin = ({ file, value }) =>
  namesFile({ file, value }) ||
  childObjects(value).some((child) =>
    namesFileWithin({ file, value: child.value }),
  );

const isMatch = ({ context, finding, value }) => {
  const own = value;
  return (
    (context.fileSeen || namesFileWithin({ file: finding.file, value: own })) &&
    (finding.ruleNeedle === '' ||
      ruleNames(own).includes(finding.ruleNeedle)) &&
    lineNumbers(own).some(
      (line) => line >= finding.start && line <= finding.end,
    )
  );
};

const inScope = ({ context, scope, value }) =>
  scope === undefined ||
  (context.keys.trim().split(' ')[0] === scope.section &&
    (scope.matches === undefined ||
      scope.matches.some(([field, expected]) => value[field] === expected)));

const collect = ({ context, finding, value }) => {
  const here = {
    ...context,
    fileSeen: context.fileSeen || namesFile({ file: finding.file, value }),
  };
  const deeper = childObjects(value).flatMap((child) =>
    collect({
      context: {
        ...here,
        keys: `${here.keys} ${child.key}`,
        record: here.record ?? (child.inArray ? child.value : undefined),
      },
      finding,
      value: child.value,
    }),
  );
  if (deeper.length !== 0) return deeper;
  if (
    !isMatch({ context: here, finding, value }) ||
    !inScope({ context: here, scope: finding.scope, value })
  ) {
    return [];
  }
  return [finding.whole && here.record !== undefined ? here.record : value];
};

export const matchingRecords = ({ finding, report }) => [
  ...new Set(
    (Array.isArray(report) ? report : [report])
      .filter((value) => isPlainObject(value))
      .flatMap((value) =>
        collect({
          context: {
            fileSeen: false,
            keys: '',
            record: Array.isArray(report) ? value : undefined,
          },
          finding,
          value,
        }),
      ),
  ),
];

export const flaggedCode = ({ end, start, text }) => {
  const lines = text.split('\n');
  const from = Math.max(1, start - CONTEXT_LINES);
  const to = Math.min(lines.length, end + CONTEXT_LINES);
  return {
    content_hash: hashLines(lines.slice(start - 1, end)),
    context: lines
      .slice(from - 1, to)
      .map((line, index) => `${String(from + index).padStart(5)}  ${line}`)
      .join('\n'),
    context_end: to,
    context_start: from,
    end,
    start,
  };
};

export const buildCase = ({
  analyzer,
  caseId,
  code,
  createdAt,
  explain,
  finding,
  findingId,
  markerRule,
  pr,
  records,
  shas,
  trace,
}) => ({
  case: {
    analyzer,
    base_sha: shas.base,
    case_id: caseId,
    content_hash: code.content_hash,
    created_at: createdAt,
    file: finding.file,
    finding_id: findingId,
    head_sha: shas.head,
    pr,
    rule: markerRule,
  },
  code,
  explain: explain ?? null,
  finding: records,
  schema_version: 1,
  trace: trace ?? null,
});
