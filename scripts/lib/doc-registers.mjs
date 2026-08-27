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

/**
 * Drafts are out of the planning block's scope, which `docs/agents/planning/README.md`
 * states and #987 settled by narrowing the charter rather than adding a `draft`
 * kind: a draft leaves for the ADR home and is read there under that home's
 * rules, so it carries no block. A gate walking the planning tree without this
 * exclusion fires on the first draft anyone files. A draft that carries a block
 * anyway is still checked — `adr-drafts/README.md` is itself a charter and
 * declares one — so the exclusion drops the requirement, not the schema.
 */
export const PLANNING_DRAFTS_DIR = `${PLANNING_DIR}/adr-drafts`;

/** Neither register counts its template as an entry. */
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

/** The kinds whose work is filed as issues, so a document of one must name at
 *  least one. A `standard` or a `charter` serves no single issue. */
export const ISSUE_BEARING_KINDS = new Set(['plan']);

/** `docs/product/requirements/foo.md` → `foo`. */
export const slugOf = (file) => file.slice(file.lastIndexOf('/') + 1, -3);

export const isTemplate = (file) => file.endsWith(`/${TEMPLATE_FILE}`);

/** A planning document that carries no block by charter — see PLANNING_DRAFTS_DIR. */
export const isDraft = (file) => file.startsWith(`${PLANNING_DRAFTS_DIR}/`);

/** `vp run docs:verify` → `docs:verify`; anything else → undefined. */
export const commandTask = (ref) => /^vp run ([a-z][\w:-]*)$/.exec(ref)?.[1];

/**
 * Why an evidence pointer does not resolve, or undefined when it does. One home
 * for the rule, because the gate and the distance report both ask it and a
 * second copy is how the two would come to disagree about the same pointer. The
 * gate turns each reason into a message; the report only counts.
 *
 * `resolves` answers "does this repo-relative path exist"; `rootTasks` is the
 * root manifest's task names. Resolving a pointer is not running it.
 */
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

/** The field's value when it is a list of strings, else undefined. */
export const stringList = (fields, key) => {
  const value = fields[key];
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
};

/** A parsed document: its path, its frontmatter, its body, and any parse error
 *  the block hit. `register` is `requirement` or `planning`. */
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

/** The workspace directory names a document declares, ignoring a malformed
 *  `packages` field — the schema check reports that separately. */
export const packagesOf = (entry) => stringList(entry.fields, 'packages') ?? [];

/**
 * Every entry that names `workspace` in its `packages`, in register then path
 * order. This is the question "what does this package owe?", which is a grep
 * today and answers with every file that merely mentions the name.
 */
export const documentsForPackage = (entries, workspace) =>
  entries.filter((entry) => packagesOf(entry).includes(workspace));
