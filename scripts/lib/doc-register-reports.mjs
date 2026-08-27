/**
 * The two questions the registers can answer once they are machine-readable,
 * rendered as text: how far the product is from its intent, and which documents
 * concern one package.
 *
 * Both are measurements, so neither is ever written to a tracked file
 * (ADR-049): the callers print them and nothing else. A distance committed to
 * git is right on the day it is written and wrong from the next commit, with
 * nothing to say which — which is the failure `docs/product/README.md` names
 * when it forbids a percentage in the register itself.
 *
 * Everything here is pure: entries in, string out.
 */
import { packagesOf, pointerFailure } from './doc-registers.mjs';

/**
 * What the distance report is NOT, said in the report rather than only here.
 * It resolves pointers — it never executes one — so a `met` requirement is a
 * declaration this restates, not a result it reproduced.
 */
export const RESOLUTION_NOTICE = [
  'Pointers were resolved, not run.',
  'Each `evidence` ref was checked to name something that exists — a path in this',
  'tree, or a task in the root manifest. Nothing here executed a test, a build or',
  'a gate, so no line above is a measurement of behaviour: `state` is declared by',
  'whoever last changed the answer (ADR-093) and this report restates it. That a',
  '`met` requirement’s command could fail is a procedure for its author and',
  'reviewer, not something any report can show.',
  '',
  'This report writes no file. Redirect stdout to keep a copy — it belongs in a PR',
  'or an issue, dated, and never in a tracked document (ADR-049).',
].join('\n');

const pad = (text, width) => text.padEnd(width, ' ');

/** `label  n/m met` rows, widest label first setting the column. */
const tallyRows = (tallies) => {
  const width = Math.max(...[...tallies.keys()].map((key) => key.length), 0);
  return [...tallies.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, { met, total }]) => `  ${pad(key, width)}  ${met}/${total} met`,
    );
};

/** Counts by some key each requirement declares one or more of. */
const tallyBy = (requirements, keysOf) => {
  const tallies = new Map();
  for (const entry of requirements) {
    for (const key of keysOf(entry)) {
      const tally = tallies.get(key) ?? { met: 0, total: 0 };
      tallies.set(key, {
        met: tally.met + (entry.fields.state === 'met' ? 1 : 0),
        total: tally.total + 1,
      });
    }
  }
  return tallies;
};

const issuesOf = (entry) => {
  const issues = Array.isArray(entry.fields.issues) ? entry.fields.issues : [];
  return issues.map((issue) => (issue.startsWith('#') ? issue : `#${issue}`));
};

const describeIssues = (entry) => {
  const issues = issuesOf(entry);
  return issues.length === 0 ? 'no open issue' : issues.join(', ');
};

const asList = (values) => (values.length === 0 ? '—' : values.join(', '));

const unmetRows = (requirements) => {
  const unmet = requirements.filter((entry) => entry.fields.state !== 'met');
  const width = Math.max(...unmet.map((entry) => entry.slug.length), 0);
  return unmet
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(
      (entry) =>
        `  ${pad(entry.slug, width)}  ${describeIssues(entry)}  [${asList(packagesOf(entry))}]`,
    );
};

const section = (title, rows) => [title, ...rows, ''].join('\n');

/** Every evidence pointer in the register, with the reason it does not resolve
 *  (or undefined). Resolving is not running — see RESOLUTION_NOTICE. */
const resolvePointers = (requirements, context) =>
  requirements.flatMap((entry) =>
    (Array.isArray(entry.fields.evidence) ? entry.fields.evidence : []).map(
      (pointer) => ({
        entry,
        reason: pointerFailure(pointer, context),
        ref: pointer?.ref,
      }),
    ),
  );

const unresolvedRows = (pointers) =>
  pointers
    .filter(({ reason }) => reason !== undefined)
    .map(({ entry, reason, ref }) => `  ${entry.slug}  ${ref} (${reason})`);

/**
 * The distance report: what the register declares, counted three ways, then
 * every unmet requirement with the issues that would move it.
 *
 * `resolves` and `rootTasks` come from `readRegisters`; they are what makes the
 * pointer line a fact rather than a claim.
 */
export const distanceReport = ({ requirements, resolves, rootTasks }) => {
  const met = requirements.filter((entry) => entry.fields.state === 'met');
  const pointers = resolvePointers(requirements, { resolves, rootTasks });
  const unresolved = unresolvedRows(pointers);
  return [
    `Product distance — ${requirements.length} requirement(s) read`,
    '',
    `  met       ${met.length}`,
    `  unmet     ${requirements.length - met.length}`,
    `  evidence  ${pointers.length - unresolved.length}/${pointers.length} pointer(s) resolve`,
    '',
    ...(unresolved.length === 0
      ? []
      : [
          section(
            'Unresolved pointers — `vp run registers:verify` fails on these',
            unresolved,
          ),
        ]),
    section(
      'By product line',
      tallyRows(
        tallyBy(requirements, (entry) =>
          Array.isArray(entry.fields.lines) ? entry.fields.lines : [],
        ),
      ),
    ),
    section(
      'By persona',
      tallyRows(tallyBy(requirements, (entry) => [entry.fields.persona])),
    ),
    section('By package', tallyRows(tallyBy(requirements, packagesOf))),
    section('Unmet — requirement, issues, packages', unmetRows(requirements)),
    RESOLUTION_NOTICE,
  ].join('\n');
};

const documentRow = (entry, width) => {
  const state = entry.fields.state ?? entry.fields.kind ?? '?';
  const label = pad(`[${state}]`, width + 2);
  return `  ${label} ${entry.file}  ${describeIssues(entry)}`;
};

const documentRows = (entries) => {
  const width = Math.max(
    ...entries.map(
      (entry) => `${entry.fields.state ?? entry.fields.kind ?? '?'}`.length,
    ),
    0,
  );
  return entries.map((entry) => documentRow(entry, width));
};

/**
 * Every document that declares `workspace` in its `packages` field, from both
 * registers. The question this answers used to be a grep, which returns every
 * file that merely mentions the name.
 */
export const packageDocsReport = ({ planning, requirements, workspace }) => {
  const found = requirements.length + planning.length;
  return [
    `Documents concerning \`${workspace}\` — ${found} declaring it in \`packages:\``,
    '',
    section(
      `Requirements (${requirements.length})`,
      requirements.length === 0 ? ['  none'] : documentRows(requirements),
    ),
    section(
      `Planning documents (${planning.length})`,
      planning.length === 0 ? ['  none'] : documentRows(planning),
    ),
    'Declared, not inferred: a document appears here because its frontmatter names',
    'this workspace, so a file that merely mentions the name does not. Read from the',
    'working tree — no network, no GitHub.',
  ].join('\n');
};
