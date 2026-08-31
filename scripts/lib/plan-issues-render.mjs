/**
 * Pure half of `plan-issues.mjs`: turn an issue record into a body that passes
 * `validateIssueBody` — the same spec `issue-standards.yml` runs on open.
 *
 * Why this exists: the planning document writes epics and governance entries
 * compactly, so three of the gate's five required sections are simply absent
 * from them. Creating those issues verbatim produces issues that fail the gate
 * the moment they open. So sections are DERIVED rather than invented: every
 * derivation is mechanical, stated in `DERIVED_NOTE`, and each body links back
 * to its source entry so a reader can check the original wording.
 */

/** Marks a section this module derived, so it is never mistaken for authored text. */
const DERIVED_NOTE = '_Derived from the planning entry; see the source link._';

export const knownLabels = (labels, allowed) =>
  labels.filter((label) => allowed.includes(label));

export const unknownLabels = (labels, allowed) =>
  labels.filter((label) => !allowed.includes(label));

const DEFAULT_SOURCE = 'the planning document';

const epicObjective = (record) =>
  record.dependencies.children.length > 0
    ? `Every child issue is closed: ${record.dependencies.children.join(', ')}.\n\n${DERIVED_NOTE}`
    : `Every child issue is closed.\n\n${DERIVED_NOTE}`;

const objectiveOf = (record) =>
  record.sections.objective !== ''
    ? record.sections.objective
    : epicObjective(record);

const contextOf = (record, source = DEFAULT_SOURCE) => {
  const facts = [
    (record.note ?? '') === '' ? '' : `**Note:** ${record.note}`,
    record.milestone === '' ? '' : `**Milestone:** ${record.milestone}`,
    record.dependencies.parent === undefined
      ? ''
      : `**Parent:** ${record.dependencies.parent}`,
    record.dependencies.blockedBy.length === 0
      ? ''
      : `**Blocked by:** ${record.dependencies.blockedBy.join(', ')}`,
    record.dependencies.blocking.length === 0
      ? ''
      : `**Blocks:** ${record.dependencies.blocking.join(', ')}`,
  ].filter((fact) => fact !== '');
  const provenance = `Planned as \`${record.id}\` in \`${source}\`.`;
  return [record.sections.context, facts.join(' · '), provenance]
    .filter((part) => part !== '')
    .join('\n\n');
};

const reproductionOf = (record) => {
  if (record.sections.reproduction !== '') {
    return record.sections.reproduction;
  }
  if (record.labels.includes('type: bug')) {
    return `See the Problem Statement — steps were not recorded in the plan.\n\n${DERIVED_NOTE}`;
  }
  return 'Not a bug.';
};

const epicScope = (record) =>
  `### In Scope\n\nTracking the child issues: ${record.dependencies.children.join(', ') || 'none listed'}.\n\n` +
  `### Out of Scope\n\nImplementation work — an epic tracks its children and carries no changes of its own.\n\n${DERIVED_NOTE}`;

const scopeOf = (record) => {
  if (record.sections.scope !== '') {
    return record.sections.scope;
  }
  if (record.kind === 'epic') {
    return epicScope(record);
  }
  return (
    `### In Scope\n\nThe objective above.\n\n` +
    `### Out of Scope\n\nAnything the objective does not name.\n\n${DERIVED_NOTE}`
  );
};

const acceptanceOf = (record) => {
  if (record.sections.acceptance !== '') {
    return record.sections.acceptance;
  }
  if (record.kind === 'epic') {
    return `- [ ] Every child issue is closed\n\n${DERIVED_NOTE}`;
  }
  return `- [ ] The objective above is met\n- [ ] No regressions\n\n${DERIVED_NOTE}`;
};

const dependencyBlock = ({ blocking, blockedBy, parent, children }) =>
  '```yaml\ndependencies:\n' +
  `  blocking: [${blocking.join(', ')}]\n` +
  `  blockedBy: [${blockedBy.join(', ')}]\n` +
  `  parent: ${parent ?? 'null'}\n` +
  `  children: [${children.join(', ')}]\n` +
  '```';

export const renderIssueBody = (record, source = DEFAULT_SOURCE) =>
  [
    `## 1. Problem Statement\n\n${record.sections.problem || 'Not recorded in the plan.'}`,
    `## 2. Objective\n\n${objectiveOf(record)}`,
    `## 3. Context & Background\n\n${contextOf(record, source)}`,
    `## 4. Reproduction Steps\n\n${reproductionOf(record)}`,
    `## 5. Scope Definition\n\n${scopeOf(record)}`,
    `## 6. Acceptance Criteria\n\n${acceptanceOf(record)}`,
    `## 7. Implementation Notes\n\n${record.sections.notes || 'None.'}`,
    `## 8. Related Work\n\n${record.sections.related || 'None.'}`,
    `## 9. Planning Metadata\n\n${dependencyBlock(record.dependencies)}`,
  ].join('\n\n');
