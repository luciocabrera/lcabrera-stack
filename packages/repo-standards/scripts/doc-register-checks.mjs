/**
 * Every rule the two doc registers are gated on, as pure functions over parsed
 * entries. The effects — reading the tree, resolving a pointer, printing —
 * belong to `verify-doc-registers.mjs`; keeping them out is what lets each rule
 * be shown failing on a planted violation and passing on its correction, which
 * is the only evidence that a rule is loaded at all (AGENTS.md Rule 14).
 *
 * One rule is deliberately half-checked and says so where it is implemented:
 * a requirement declaring `met` must point at a command CI runs AND that could
 * fail. Whether a check could fail is not derivable from any file in the tree,
 * so it stays a procedure for the author and the reviewer (`docs/product/README.md`).
 * A check that appeared to cover it would be worse than none.
 */
import { cycleFindings, duplicateIdFindings } from './doc-register-graph.mjs';
import {
  commandTask,
  EVIDENCE_FIELDS,
  EVIDENCE_TYPES,
  ISSUE_BEARING_KINDS,
  isDraft,
  PLANNING_DIR,
  REQUIREMENTS_DIR,
  PERSONAS,
  PLANNING_FIELDS,
  PLANNING_KINDS,
  PLANNING_STATUSES,
  pointerFailure,
  PRODUCT_LINES,
  REQUIREMENT_FIELDS,
  REQUIREMENT_STATES,
} from './doc-registers.mjs';

const KEBAB_CASE = /^[a-z\d]+(?:-[a-z\d]+)*$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const REQUIREMENT_ISSUE = /^\d+$/;
const PLANNING_ISSUE = /^#\d+$/;

const describe = (value) => {
  if (value === undefined) {
    return '(absent)';
  }
  return Array.isArray(value) ? 'a list' : `\`${value}\``;
};

const sorted = (values) =>
  [...values].sort((a, b) => a.localeCompare(b)).join(', ');

const schemaProblems = (fields, allowed) => {
  const declared = Object.keys(fields);
  return [
    ...allowed
      .filter((key) => !declared.includes(key))
      .map((key) => `missing field \`${key}\``),
    ...declared
      .filter((key) => !allowed.includes(key))
      .map((key) => `unknown field \`${key}\``),
  ];
};

const scalarProblems = (label, value, allowed) =>
  typeof value === 'string' && allowed.has(value)
    ? []
    : [
        `\`${label}\` must be one of ${sorted(allowed)} — got ${describe(value)}`,
      ];

const listProblems = (label, value, expected, accepts) => {
  if (!Array.isArray(value)) {
    return [`\`${label}\` must be a list — got ${describe(value)}`];
  }
  return value
    .filter((item) => typeof item !== 'string' || !accepts(item))
    .map((item) => `\`${label}\` item ${describe(item)} ${expected}`);
};

const idProblems = (entry) => {
  const { id } = entry.fields;
  if (typeof id !== 'string' || !KEBAB_CASE.test(id)) {
    return [`\`id\` must be a kebab-case slug — got ${describe(id)}`];
  }
  return id === entry.slug
    ? []
    : [`\`id\` is \`${id}\` but the filename slug is \`${entry.slug}\``];
};

const evidenceShapeProblems = (pointer, index) => {
  if (typeof pointer !== 'object' || Array.isArray(pointer)) {
    return [`\`evidence\` item ${index + 1} must be a \`type\`/\`ref\` pair`];
  }
  return schemaProblems(pointer, EVIDENCE_FIELDS).map(
    (problem) => `\`evidence\` item ${index + 1}: ${problem}`,
  );
};

const pointerProblems = (pointer, index, context) => {
  const { ref, type } = pointer;
  const at = `\`evidence\` item ${index + 1}`;
  if (!EVIDENCE_TYPES.has(type)) {
    return [
      `${at}: \`type\` must be one of ${sorted(EVIDENCE_TYPES)} — got ${describe(type)}`,
    ];
  }
  const reason = pointerFailure(pointer, context);
  const message = {
    malformed: `\`ref\` must be a path or a \`vp run\` command — got ${describe(ref)}`,
    missing: `\`${ref}\` resolves to nothing in this repo`,
    'not-a-command': `a \`command\` ref must read \`vp run <task>\` — got \`${ref}\``,
    'unknown-task': `\`${ref}\` names no task in the root manifest`,
  }[reason];
  return message === undefined ? [] : [`${at}: ${message}`];
};

const evidenceProblems = (entry, context) => {
  const pointers = entry.fields.evidence;
  if (!Array.isArray(pointers) || pointers.length === 0) {
    return ['`evidence` must list at least one typed pointer'];
  }
  return pointers.flatMap((pointer, index) => {
    const shape = evidenceShapeProblems(pointer, index);
    return shape.length > 0 ? shape : pointerProblems(pointer, index, context);
  });
};

const metProblems = (entry, { ciCommands }) => {
  if (entry.fields.state !== 'met') {
    return [];
  }
  const pointers = Array.isArray(entry.fields.evidence)
    ? entry.fields.evidence
    : [];
  const backed = pointers.some((pointer) => {
    if (pointer?.type !== 'command') {
      return false;
    }
    const task = commandTask(pointer.ref);
    return task !== undefined && ciCommands.has(task);
  });
  return backed
    ? []
    : [
        '`state: met` carries no `command` evidence pointer that CI runs — add one, or declare `unmet`',
      ];
};

const H1 = /^# \S/m;
const REQUIRED_SECTIONS = [/^## Statement$/m, /^## Acceptance$/m];
const CHECKBOX = /^[ \t]*[*-] \[[ xX]\]/m;

const bodyProblems = (entry) => {
  const problems = [];
  if (!H1.test(entry.body)) {
    problems.push('body has no `# ` title');
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!section.test(entry.body)) {
      problems.push(`body has no \`${section.source.slice(1, -1)}\` section`);
    }
  }
  if (CHECKBOX.test(entry.body)) {
    problems.push(
      'body carries a checkbox — `state` is the one declaration (docs/product/README.md)',
    );
  }
  return problems;
};

export const requirementProblems = (entry, context) => {
  if (!entry.hasBlock) {
    return ['has no `---` frontmatter block'];
  }
  const schema = [
    ...entry.errors,
    ...schemaProblems(entry.fields, REQUIREMENT_FIELDS),
  ];
  if (schema.length > 0) {
    return schema;
  }
  const { fields } = entry;
  return [
    ...idProblems(entry),
    ...listProblems(
      'lines',
      fields.lines,
      `must be one of ${sorted(PRODUCT_LINES)}`,
      (item) => PRODUCT_LINES.has(item),
    ),
    ...(Array.isArray(fields.lines) && fields.lines.length === 0
      ? ['`lines` must name at least one product line']
      : []),
    ...scalarProblems('persona', fields.persona, PERSONAS),
    ...scalarProblems('state', fields.state, REQUIREMENT_STATES),
    ...listProblems(
      'packages',
      fields.packages,
      'must be a workspace directory name',
      (item) => context.roster.has(item),
    ),
    ...listProblems(
      'requires',
      fields.requires,
      'must be the id of another requirement',
      (item) => context.ids.has(item),
    ),
    ...listProblems(
      'issues',
      fields.issues,
      'must be a bare issue number',
      (item) => REQUIREMENT_ISSUE.test(item),
    ),
    ...evidenceProblems(entry, context),
    ...metProblems(entry, context),
    ...bodyProblems(entry),
  ];
};

const isRealDate = (value) => {
  const parts = ISO_DATE.exec(value);
  if (parts === null) {
    return false;
  }
  const [, year, month, day] = parts;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day) &&
    date.getUTCFullYear() === Number(year)
  );
};

export const planningProblems = (entry, context) => {
  if (!entry.hasBlock) {
    return ['has no `---` frontmatter block'];
  }
  const schema = [
    ...entry.errors,
    ...schemaProblems(entry.fields, PLANNING_FIELDS),
  ];
  if (schema.length > 0) {
    return schema;
  }
  const { fields } = entry;
  const planWithoutIssue =
    ISSUE_BEARING_KINDS.has(fields.kind) &&
    Array.isArray(fields.issues) &&
    fields.issues.length === 0;
  return [
    ...scalarProblems('kind', fields.kind, PLANNING_KINDS),
    ...scalarProblems('status', fields.status, PLANNING_STATUSES),
    ...(typeof fields.recorded === 'string' && isRealDate(fields.recorded)
      ? []
      : [
          `\`recorded\` must be a YYYY-MM-DD date — got ${describe(fields.recorded)}`,
        ]),
    ...listProblems(
      'issues',
      fields.issues,
      'must be a `#`-prefixed issue number',
      (item) => PLANNING_ISSUE.test(item),
    ),
    ...(planWithoutIssue
      ? [
          '`kind: plan` names no issue — a plan whose work is not filed is scratch, and scratch belongs in `.tmp/`',
        ]
      : []),
    ...listProblems(
      'packages',
      fields.packages,
      'must be a workspace directory name',
      (item) => context.roster.has(item),
    ),
  ];
};

export const carriesPlanningBlock = (entry, planningDir) =>
  !isDraft(entry.file, planningDir) || entry.hasBlock;

export const registerFindings = ({
  ciCommands,
  planning,
  planningDir = PLANNING_DIR,
  requirements,
  requirementsDir = REQUIREMENTS_DIR,
  resolves,
  rootTasks,
  roster,
}) => {
  const context = {
    ciCommands,
    ids: new Set(requirements.map((entry) => entry.slug)),
    resolves,
    roster,
    rootTasks,
  };
  const empty = [
    ...(requirements.length === 0
      ? [
          {
            file: requirementsDir,
            message:
              'read no entries — refusing to report a clean pass on no data',
          },
        ]
      : []),
    ...(planning.length === 0
      ? [
          {
            file: planningDir,
            message:
              'read no entries — refusing to report a clean pass on no data',
          },
        ]
      : []),
  ];
  return [
    ...empty,
    ...requirements.flatMap((entry) =>
      requirementProblems(entry, context).map((message) => ({
        file: entry.file,
        message,
      })),
    ),
    ...duplicateIdFindings(requirements),
    ...cycleFindings(requirements),
    ...planning
      .filter((entry) => carriesPlanningBlock(entry, planningDir))
      .flatMap((entry) =>
        planningProblems(entry, context).map((message) => ({
          file: entry.file,
          message,
        })),
      ),
  ];
};
