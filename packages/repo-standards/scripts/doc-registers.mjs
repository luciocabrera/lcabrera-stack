/**
 * The shared vocabulary of the two documentation registers — where each lives,
 * which fields it declares, and which values those fields may take. One module
 * so the gate and the two reports read the same schema; a second copy of a
 * field name is how a register and its checker start disagreeing.
 *
 * The schemas themselves are owned by `docs/product/README.md` and
 * `docs/agents/planning/README.md`; this is their machine-readable half, and
 * those pages win if the two ever differ.
 *
 * Two shapes differ between the registers and both are deliberate: `issues` is
 * bare integers in a requirement and `#`-prefixed strings in a planning
 * document, and `packages` names workspace DIRECTORIES (`node-runtime`) rather
 * than npm names (`@lcabrera/node`) in both.
 *
 * Everything here is pure.
 */
import { bodyOf, parseFrontmatter } from './doc-register-frontmatter.mjs';

export const REQUIREMENTS_DIR = 'docs/product/requirements';
export const PLANNING_DIR = 'docs/agents/planning';

export const TEMPLATE_FILE = '_TEMPLATE.md';

export const REQUIREMENT_FIELDS = [
  'id',
  'lines',
  'persona',
  'state',
  'packages',
  'requires',
  'issues',
  'evidence',
];

export const PRODUCT_LINES = new Set(['application', 'toolchain']);
export const PERSONAS = new Set([
  'application-developer',
  'data-user',
  'project-starter',
  'repository-maintainer',
]);
export const REQUIREMENT_STATES = new Set(['met', 'unmet']);
export const EVIDENCE_TYPES = new Set(['code', 'command', 'doc', 'test']);
export const EVIDENCE_FIELDS = ['type', 'ref'];

export const PLANNING_FIELDS = [
  'kind',
  'status',
  'recorded',
  'issues',
  'packages',
];

export const PLANNING_KINDS = new Set([
  'charter',
  'plan',
  'standard',
  'summary',
]);
export const PLANNING_STATUSES = new Set(['landed', 'live', 'superseded']);

export const ISSUE_BEARING_KINDS = new Set(['plan']);

export const slugOf = (file) => file.slice(file.lastIndexOf('/') + 1, -3);

export const isTemplate = (file) => file.endsWith(`/${TEMPLATE_FILE}`);

export const isDraft = (file, planningDir = PLANNING_DIR) =>
  file.startsWith(`${planningDir}/adr-drafts/`);

export const commandTask = (ref) => /^vp run ([a-z][\w:-]*)$/.exec(ref)?.[1];

export const pointerFailure = (pointer, { resolves, rootTasks }) => {
  const ref = pointer?.ref;
  if (typeof ref !== 'string' || ref === '') {
    return 'malformed';
  }
  if (pointer.type !== 'command') {
    return resolves(ref) ? undefined : 'missing';
  }
  const task = commandTask(ref);
  if (task === undefined) {
    return 'not-a-command';
  }
  return rootTasks.has(task) ? undefined : 'unknown-task';
};

export const stringList = (fields, key) => {
  const value = fields[key];
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
};

export const toEntry = ({ file, register, source }) => {
  const parsed = parseFrontmatter(source);
  return {
    body: bodyOf(source),
    errors: parsed?.errors ?? [],
    fields: parsed?.fields ?? {},
    file,
    hasBlock: parsed !== undefined,
    register,
    slug: slugOf(file),
  };
};

export const packagesOf = (entry) => stringList(entry.fields, 'packages') ?? [];

export const documentsForPackage = (entries, workspace) =>
  entries.filter((entry) => packagesOf(entry).includes(workspace));
