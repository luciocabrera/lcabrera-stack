#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { validateSkills } = require('./validate-skills.cjs');

const repoRoot = process.cwd();
const reportOutputPath = path.join(
  repoRoot,
  'reports',
  'skills',
  'code-smell-compliance-report.md',
);
const planOutputPath = path.join(
  repoRoot,
  'reports',
  'skills',
  'agenting-plan-progress.md',
);

const now = new Date();
const generatedAt = now.toISOString();

const ensureDirectoryForFile = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

const createPlanIfMissing = () => {
  if (fs.existsSync(planOutputPath)) {
    return;
  }

  const initialPlan = `# Agenting Workflow Plan and Progress

## Plan

1. Add skill contract validator automation.
2. Generate canonical markdown compliance report from each run.
3. Wire CI execution for contract + report generation.
4. Keep an appended run log for auditability and trend tracking.

## Progress Log

`;

  ensureDirectoryForFile(planOutputPath);
  fs.writeFileSync(planOutputPath, initialPlan, 'utf8');
};

const createFindingsMarkdown = (errors) => {
  if (errors.length === 0) {
    return 'No catalog findings on this audit.';
  }

  return errors
    .map((error, index) => {
      const findingId = `F-${String(index + 1).padStart(3, '0')}`;
      return [
        `### Finding ${findingId}`,
        `- finding_id: ${findingId}`,
        '- rule_id: CHK.SKILL.CONTRACT',
        '- severity: HIGH',
        '- confidence: high',
        '- location_path: .github/skills/',
        '- location_hint: frontmatter/links contract',
        '- evidence_excerpt:',
        '```text',
        error,
        '```',
        '- why: Skill contract violations break deterministic agent behavior in automation.',
        '- fix: Correct the reported skill contract field or link and re-run validation.',
        '- effort: small',
        '- defer_risk: Skill regressions can merge without reliable detection.',
        '- verification_steps:',
        '  - Run `node scripts/validate-skills.cjs` and confirm zero errors.',
        '  - Re-run this report generator and verify findings are cleared.',
        '- status: open',
      ].join('\n');
    })
    .join('\n\n');
};

const buildReport = (result) => {
  const highCount = result.errors.length;
  const firstActions =
    result.errors.length === 0
      ? ['No actions required.']
      : [
          'Fix frontmatter contract errors listed in Findings.',
          'Re-run skill validation and ensure zero errors.',
          'Commit updated skills and keep CI skill gate green.',
        ];

  return [
    '# Smell Findings Report',
    '',
    '## Metadata',
    '- schema_version: 1.0',
    `- report_id: skills-compliance-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`,
    `- generated_at: ${generatedAt}`,
    '- skill_name: code-smell-checker',
    '- repository: lcabrera-stack',
    '- scope_type: repo',
    '- scope_value: .github/skills',
    '- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT',
    '- classification: config',
    '- primary_lens: Mixed',
    '',
    '## Summary',
    `- files_analyzed: ${result.checkedSkillCount}`,
    '- findings_count_by_severity:',
    '- blocker: 0',
    `- high: ${highCount}`,
    '- medium: 0',
    '- low: 0',
    '- nit: 0',
    `- top_risk: ${result.errors.length === 0 ? 'No active skill contract risk detected.' : 'Skill contract violations reduce reliability of automatic agenting workflows.'}`,
    '- first_3_actions:',
    ...firstActions.map((action, index) => `  ${index + 1}. ${action}`),
    '',
    '## Findings',
    '',
    createFindingsMarkdown(result.errors),
    '',
    '## Prioritized Execution Queue',
    result.errors.length === 0
      ? 'No queue items required.'
      : [
          '1. queue_rank: 1',
          '- target_finding_ids: F-001',
          '- reason_for_order: Contract issues are immediate blockers for dependable skill automation.',
          '- expected_outcome: Skill validation passes consistently.',
        ].join('\n'),
    '',
    '## Deferred Items',
    'None.',
    '',
    '## Validation Checklist',
    `- [x] Required sections present`,
    `- [x] Required metadata fields present`,
    `- [x] Summary counts match findings`,
    `- [x] Each finding has evidence_excerpt, why, fix`,
    `- [x] Each finding has verification_steps`,
    `- [x] Severity values are canonical`,
    `- [x] Prioritized queue present when findings exist`,
    '',
    '## Closure Criteria',
    '- Skill validation passes with zero errors.',
    '- CI workflow for skill validation remains green on PRs.',
    '- Progress log confirms latest successful run.',
    '',
    '> Template source: .github/skills/code-smell-shared/REPORT_TEMPLATE.md',
  ].join('\n');
};

const appendProgressEntry = (result) => {
  const runStatus = result.errors.length === 0 ? 'PASS' : 'FAIL';
  const entry = [
    `### ${generatedAt} - ${runStatus}`,
    `- Checked skills: ${result.checkedSkillCount}`,
    `- Skipped directories: ${result.skippedDirectories.length > 0 ? result.skippedDirectories.join(', ') : 'none'}`,
    `- Findings: ${result.errors.length}`,
    result.errors.length === 0
      ? '- Notes: Skill contract is compliant.'
      : '- Notes: Skill contract issues detected, see code-smell-compliance-report.md.',
    '',
  ].join('\n');

  fs.appendFileSync(planOutputPath, entry, 'utf8');
};

const main = () => {
  const result = validateSkills({ repoRoot });

  createPlanIfMissing();
  ensureDirectoryForFile(reportOutputPath);

  const report = buildReport(result);
  fs.writeFileSync(reportOutputPath, report, 'utf8');
  appendProgressEntry(result);

  console.log(`Report written to ${path.relative(repoRoot, reportOutputPath)}`);
  console.log(`Plan updated at ${path.relative(repoRoot, planOutputPath)}`);

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
};

main();
