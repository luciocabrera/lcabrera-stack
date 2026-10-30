/**
 * Decides whether every false-positive marker in the tree matches one live
 * entry of `docs/agents/false-positives.json`, and whether every entry is
 * backed by a unanimous panel of three distinct models. Pure: the caller reads
 * the files and validates each case envelope against its schema. Policy:
 * `docs/agents/public-package-suppressions.md`.
 */
import { coveredLines, hashLines } from './false-positive-markers.mjs';

const ENTRY_FIELDS = [
  'case',
  'analyzer',
  'rule',
  'file',
  'contentHash',
  'expires',
  'evidence',
];

const PANEL_SIZE = 3;

const MAX_MONTHS = 6;

const DATE = /^\d{4}-\d{2}-\d{2}$/u;

const problem = (kind, where, message) => ({ kind, message, where });

const markerWhere = ({ file, line }) => `${file}:${line}`;

const markerProblems = ({ entriesByCase, marker }) => {
  const where = markerWhere(marker);
  if (!marker.nextLine) {
    return [
      problem(
        'form',
        where,
        `${marker.directive} covers more than the next line; use the analyzer's next-line marker`,
      ),
    ];
  }
  if (marker.caseId === undefined) {
    return [problem('no-case', where, 'the marker names no case FP-nnnn')];
  }
  if (marker.reason === '') {
    return [
      problem(
        'no-reason',
        where,
        `the marker gives no reason after "false positive, case ${marker.caseId}:"`,
      ),
    ];
  }
  const entry = entriesByCase.get(marker.caseId);
  if (entry === undefined) {
    return [
      problem(
        'unlisted',
        where,
        `${marker.caseId} has no entry in the false-positive list`,
      ),
    ];
  }
  return ['analyzer', 'rule', 'file']
    .filter((field) => entry[field] !== marker[field])
    .map((field) =>
      problem(
        'mismatch',
        where,
        `the marker's ${field} "${marker[field]}" differs from ${marker.caseId}'s "${entry[field]}"`,
      ),
    );
};

const addMonths = (iso, months) => {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};

const shapeProblems = (entry) => {
  const missing = ENTRY_FIELDS.filter(
    (field) => typeof entry[field] !== 'string' || entry[field].trim() === '',
  );
  const badLines = !Number.isSafeInteger(entry.lines) || entry.lines < 1;
  const badDate = !DATE.test(entry.expires ?? '');
  const evidence = `docs/agents/adjudications/${entry.case}.json`;
  return [
    ...missing.map((field) =>
      problem('entry', entry.case, `the entry has no "${field}"`),
    ),
    ...(badLines
      ? [problem('entry', entry.case, '"lines" is not a positive integer')]
      : []),
    ...(badDate && !missing.includes('expires')
      ? [problem('entry', entry.case, '"expires" is not a YYYY-MM-DD date')]
      : []),
    ...(entry.evidence !== undefined && entry.evidence !== evidence
      ? [problem('entry', entry.case, `"evidence" is not ${evidence}`)]
      : []),
  ];
};

const markerCountProblems = ({ entry, markers }) => {
  const count = markers.filter(({ caseId }) => caseId === entry.case).length;
  if (count === 1) return [];
  return [
    problem(
      count === 0 ? 'unmarked' : 'duplicated',
      entry.case,
      count === 0
        ? `no marker in the code names ${entry.case}`
        : `${count} markers name ${entry.case}; an entry has exactly one`,
    ),
  ];
};

const caseFieldProblems = ({ envelope, entry }) =>
  [
    ['case_id', 'case'],
    ['analyzer', 'analyzer'],
    ['rule', 'rule'],
    ['file', 'file'],
    ['content_hash', 'contentHash'],
  ]
    .filter(
      ([caseField, entryField]) =>
        envelope.case[caseField] !== entry[entryField],
    )
    .map(([caseField, entryField]) =>
      problem(
        'case-mismatch',
        entry.case,
        `the case file's ${caseField} differs from the entry's ${entryField}`,
      ),
    );

const panelProblems = ({ envelope, entry }) => {
  const { outcome, verifiers } = envelope;
  const models = new Set(verifiers.map(({ model }) => model));
  const roles = verifiers.map(({ role }) => role);
  const split = verifiers.some(({ verdict }) => verdict !== 'FALSE_POSITIVE');
  return [
    ...(verifiers.length === PANEL_SIZE && models.size === PANEL_SIZE
      ? []
      : [
          problem(
            'models',
            entry.case,
            `the panel sat ${verifiers.length} verifier(s) on ${models.size} distinct model(s); it needs ${PANEL_SIZE} on ${PANEL_SIZE}`,
          ),
        ]),
    ...(roles.filter((role) => role === 'judge').length === 2 &&
    roles.includes('adversary')
      ? []
      : [
          problem(
            'roles',
            entry.case,
            'the panel needs two judges and one adversary',
          ),
        ]),
    ...(outcome === 'dismissed' && !split
      ? []
      : [
          problem(
            'not-unanimous',
            entry.case,
            `the panel did not rule FALSE_POSITIVE unanimously (outcome ${outcome})`,
          ),
        ]),
  ];
};

const evidenceProblems = ({ entry, readCase }) => {
  const read = readCase(entry.evidence);
  if (read.missing) {
    return [
      problem('no-case-file', entry.case, `${entry.evidence} does not exist`),
    ];
  }
  if (!read.ok) {
    return [
      problem(
        'case-invalid',
        entry.case,
        `${entry.evidence} is not a valid case envelope: ${read.problems.join('; ')}`,
      ),
    ];
  }
  const { envelope } = read;
  const limit = addMonths(envelope.case.created_at, MAX_MONTHS);
  return [
    ...caseFieldProblems({ entry, envelope }),
    ...panelProblems({ entry, envelope }),
    ...(entry.expires > limit
      ? [
          problem(
            'expiry-too-far',
            entry.case,
            `expires ${entry.expires}, past ${limit}, six months after the case opened`,
          ),
        ]
      : []),
  ];
};

const hashProblems = ({ entry, markers, readText }) => {
  const marker = markers.find(({ caseId }) => caseId === entry.case);
  if (marker === undefined) return [];
  const lines = coveredLines({
    line: marker.line,
    lines: entry.lines,
    text: readText(marker.file),
  });
  return hashLines(lines) === entry.contentHash
    ? []
    : [
        problem(
          'hash',
          entry.case,
          `the ${entry.lines} line(s) under the marker at ${markerWhere(marker)} changed since the panel ruled; the dismissal is void`,
        ),
      ];
};

const entryProblems = ({ entry, markers, readCase, readText, today }) => {
  const shape = shapeProblems(entry);
  if (shape.length > 0) return shape;
  return [
    ...markerCountProblems({ entry, markers }),
    ...(entry.expires < today
      ? [problem('expired', entry.case, `expired on ${entry.expires}`)]
      : []),
    ...evidenceProblems({ entry, readCase }),
    ...hashProblems({ entry, markers, readText }),
  ];
};

const duplicateCaseProblems = (entries) =>
  entries
    .map(({ case: caseId }) => caseId)
    .filter((caseId, index, all) => all.indexOf(caseId) !== index)
    .map((caseId) =>
      problem('entry', caseId, 'the list holds this case more than once'),
    );

export const checkFalsePositives = ({
  entries,
  markers,
  readCase,
  readText,
  today,
}) => {
  const entriesByCase = new Map(entries.map((entry) => [entry.case, entry]));
  const covering = markers.filter(({ nextLine }) => nextLine);
  return [
    ...markers.flatMap((marker) => markerProblems({ entriesByCase, marker })),
    ...duplicateCaseProblems(entries),
    ...entries.flatMap((entry) =>
      entryProblems({ entry, markers: covering, readCase, readText, today }),
    ),
  ];
};

export const expiryFor = (createdAt) => addMonths(createdAt, MAX_MONTHS);
