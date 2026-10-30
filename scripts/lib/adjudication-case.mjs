/**
 * Builds the case file a false-positive panel reads: the finding as the
 * analyzer reports it, the analyzer's own explanation and trace where it has
 * them, and the flagged code. It takes no free text, so nothing the builder
 * argued can reach the panel. Pure: `scripts/adjudicate.mjs` runs the tools.
 */
import { hashLines } from './false-positive-markers.mjs';

const FINDING_ID = /^(?<file>.+?):(?<start>\d+)(?:-(?<end>\d+))?:(?<rule>.+)$/u;

const CASE_NAME = /^FP-(\d{4,})(?:\.json)?$/u;

const CONTEXT_LINES = 10;

export const ADJUDICATED_ANALYZERS = [
  'biome',
  'eslint',
  'fallow',
  'oxlint',
  'react-doctor',
];

export const parseFindingId = (findingId) => {
  const match = FINDING_ID.exec(findingId ?? '');
  if (match === null) {
    throw new Error(
      `the finding id "${findingId}" is not <file>:<line>[-<end line>]:<rule>`,
    );
  }
  const start = Number(match.groups.start);
  const end = Number(match.groups.end ?? match.groups.start);
  if (start < 1 || end < start) {
    throw new Error(`the finding id "${findingId}" names no line range`);
  }
  return { end, file: match.groups.file, rule: match.groups.rule, start };
};

export const nextCaseId = (names) => {
  const highest = Math.max(
    0,
    ...names.flatMap((name) => {
      const match = CASE_NAME.exec(name);
      return match === null ? [] : [Number(match[1])];
    }),
  );
  return `FP-${String(highest + 1).padStart(4, '0')}`;
};

const normalized = (text) => text.toLowerCase().replaceAll('_', '-');

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

const isMatch = ({ context, finding, value }) =>
  (context.fileSeen || namesFileWithin({ file: finding.file, value })) &&
  normalized(`${context.keys} ${JSON.stringify(value)}`).includes(
    normalized(finding.ruleNeedle),
  ) &&
  lineNumbers(value).some(
    (line) => line >= finding.start && line <= finding.end,
  );

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
  if (deeper.length > 0) return deeper;
  if (!isMatch({ context: here, finding, value })) return [];
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
