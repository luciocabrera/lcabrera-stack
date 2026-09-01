/**
 * The shape of an `agent-review-verdict/v1` document —
 * `docs/agents/agent-review-contract.md` §2.2, checked by something that is not
 * a language model (§2.4 steps 2 and 3).
 *
 * Unknown fields are rejected rather than ignored on purpose: a verdict is a
 * document a merge decision is taken from, and a field the validator silently
 * drops is a field a producer can believe it is being judged on. Every
 * discrepancy is collected, so one run names them all.
 *
 * Governed by .claude/rules/scripts.md.
 */

const VERDICT_SCHEMA_ID = 'agent-review-verdict/v1';

const VERDICTS = new Set(['pass', 'fail', 'error']);
const FINDING_KINDS = new Set(['in-diff', 'omission']);
const SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const CRITERION_OUTCOMES = new Set(['met', 'not-met', 'out-of-scope']);

const DOCUMENT_FIELDS = new Set([
  'criteria',
  'error_reason',
  'findings',
  'head_sha',
  'pr',
  'reviewed_at',
  'schema',
  'verdict',
]);
const FINDING_FIELDS = new Set([
  'failure_scenario',
  'file',
  'id',
  'kind',
  'line',
  'refutation',
  'rule',
  'severity',
  'summary',
]);
const CRITERION_FIELDS = new Set([
  'criterion',
  'falsifier',
  'id',
  'method',
  'outcome',
]);

const SHA = /^[0-9a-f]{40}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

const isFilledString = (value) =>
  typeof value === 'string' && value.trim() !== '';

const isRepositoryRelative = (path) =>
  !path.startsWith('/') && !path.split('/').includes('..');

const unknownKeys = (object, allowed) =>
  Object.keys(object).filter((key) => !allowed.has(key));

const objectError = (value, where) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? undefined
    : `${where} is not an object`;

const findingShapeErrors = (finding, at) => {
  const notAnObject = objectError(finding, at);
  if (notAnObject !== undefined) {
    return [notAnObject];
  }
  const errors = unknownKeys(finding, FINDING_FIELDS).map(
    (key) => `${at} carries the unknown field \`${key}\``,
  );
  if (!isFilledString(finding.id)) {
    errors.push(`${at} has no \`id\``);
  }
  if (!FINDING_KINDS.has(finding.kind)) {
    errors.push(`${at} has \`kind\` ${JSON.stringify(finding.kind)}`);
  }
  if (!SEVERITIES.has(finding.severity)) {
    errors.push(`${at} has \`severity\` ${JSON.stringify(finding.severity)}`);
  }
  if (isFilledString(finding.file)) {
    if (!isRepositoryRelative(finding.file)) {
      errors.push(`${at} has a \`file\` that is not repository-relative`);
    }
  } else {
    errors.push(`${at} has no \`file\``);
  }
  if (finding.line !== null && !Number.isInteger(finding.line)) {
    errors.push(`${at} has a \`line\` that is neither an integer nor null`);
  }
  if (Number.isInteger(finding.line) && finding.line < 1) {
    errors.push(`${at} has a \`line\` below 1`);
  }
  if (!isFilledString(finding.summary)) {
    errors.push(`${at} has no \`summary\``);
  }
  if (!isFilledString(finding.failure_scenario)) {
    errors.push(`${at} has no \`failure_scenario\``);
  }
  return errors;
};

const criterionShapeErrors = (criterion, at) => {
  const notAnObject = objectError(criterion, at);
  if (notAnObject !== undefined) {
    return [notAnObject];
  }
  const errors = unknownKeys(criterion, CRITERION_FIELDS).map(
    (key) => `${at} carries the unknown field \`${key}\``,
  );
  if (!isFilledString(criterion.id)) {
    errors.push(`${at} has no \`id\``);
  }
  if (!isFilledString(criterion.criterion)) {
    errors.push(`${at} has no \`criterion\``);
  }
  if (!CRITERION_OUTCOMES.has(criterion.outcome)) {
    errors.push(`${at} has \`outcome\` ${JSON.stringify(criterion.outcome)}`);
  }
  if (!isFilledString(criterion.method)) {
    errors.push(`${at} has no \`method\``);
  }
  if (!isFilledString(criterion.falsifier)) {
    errors.push(
      `${at} has no \`falsifier\` — a pass records what would have shown the criterion unmet`,
    );
  }
  return errors;
};

const conditionalFieldErrors = (document) => {
  const errors = [];
  const isError = document.verdict === 'error';
  if (isError && !isFilledString(document.error_reason)) {
    errors.push('`verdict` is `error` but there is no `error_reason`');
  }
  if (!isError && document.error_reason !== undefined) {
    errors.push('`error_reason` is present on a verdict that is not `error`');
  }
  if (document.verdict === 'pass' && document.criteria === undefined) {
    errors.push(
      '`verdict` is `pass` but there is no `criteria` evidence (§2.2)',
    );
  }
  if (isError && document.criteria !== undefined) {
    errors.push(
      '`criteria` is present on an `error` verdict, which certified nothing',
    );
  }
  return errors;
};

const criteriaShapeErrors = (criteria) => {
  if (!Array.isArray(criteria)) {
    return ['`criteria` is not an array'];
  }
  if (criteria.length === 0) {
    return ['`criteria` is empty'];
  }
  return [
    ...criteria.flatMap((criterion, index) =>
      criterionShapeErrors(criterion, `criterion ${index + 1}`),
    ),
    ...duplicateIdErrors(criteria, 'criterion'),
  ];
};

const duplicateIdErrors = (entries, label) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const entry of entries) {
    const id = entry?.id;
    if (typeof id === 'string') {
      if (seen.has(id)) {
        duplicates.add(id);
      }
      seen.add(id);
    }
  }
  return [...duplicates].map(
    (id) => `${label} id \`${id}\` appears more than once`,
  );
};

export const documentShapeErrors = (document) => {
  const errors = unknownKeys(document, DOCUMENT_FIELDS).map(
    (key) => `the verdict carries the unknown field \`${key}\``,
  );
  if (document.schema !== VERDICT_SCHEMA_ID) {
    errors.push(
      `\`schema\` is ${JSON.stringify(document.schema)}, not ${JSON.stringify(VERDICT_SCHEMA_ID)}`,
    );
  }
  if (!Number.isInteger(document.pr)) {
    errors.push('`pr` is not an integer');
  }
  if (typeof document.head_sha !== 'string' || !SHA.test(document.head_sha)) {
    errors.push('`head_sha` is not a 40-character lowercase hex SHA');
  }
  if (
    typeof document.reviewed_at !== 'string' ||
    !ISO_UTC.test(document.reviewed_at) ||
    Number.isNaN(Date.parse(document.reviewed_at))
  ) {
    errors.push('`reviewed_at` is not an ISO-8601 UTC timestamp');
  }
  if (!VERDICTS.has(document.verdict)) {
    errors.push(`\`verdict\` is ${JSON.stringify(document.verdict)}`);
  }
  errors.push(...conditionalFieldErrors(document));
  if (Array.isArray(document.findings)) {
    errors.push(
      ...document.findings.flatMap((finding, index) =>
        findingShapeErrors(finding, `finding ${index + 1}`),
      ),
      ...duplicateIdErrors(document.findings, 'finding'),
    );
  } else {
    errors.push('`findings` is not an array');
  }
  if (document.criteria !== undefined) {
    errors.push(...criteriaShapeErrors(document.criteria));
  }
  return errors;
};
