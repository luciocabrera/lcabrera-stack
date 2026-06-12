#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = process.cwd();
const skillsReportsDir = path.join(repoRoot, 'reports', 'skills');
const complianceReportPath = path.join(
  skillsReportsDir,
  'code-smell-compliance-report.md',
);
const planProgressPath = path.join(
  skillsReportsDir,
  'agenting-plan-progress.md',
);
const fixPlanPath = path.join(skillsReportsDir, 'fix-plan.md');
const handoffPromptsPath = path.join(skillsReportsDir, 'handoff-prompts.md');
const handoffRunbookPath = path.join(skillsReportsDir, 'handoff-runbook.md');
const handoffSourceRunbookPath = path.join(
  skillsReportsDir,
  'handoff-runbook-source-audit.md',
);

const now = new Date();
const generatedAt = now.toISOString();

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const runComplianceGenerator = () => {
  const result = spawnSync(
    process.execPath,
    [path.join('scripts', 'generate-skills-compliance-report.cjs')],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );

  if ((result.stdout ?? '').trim().length > 0) {
    process.stdout.write(result.stdout);
  }
  if ((result.stderr ?? '').trim().length > 0) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    throw new Error('Compliance report generation failed.');
  }
};

const readReport = () => {
  if (!fs.existsSync(complianceReportPath)) {
    throw new Error(
      `Missing compliance report at ${path.relative(repoRoot, complianceReportPath)}`,
    );
  }

  return fs.readFileSync(complianceReportPath, 'utf8');
};

/**
 * @param {string} content
 * @param {RegExp} pattern
 * @param {string} fallback
 * @returns {string}
 */
const readFirstCapture = (content, pattern, fallback) => {
  const match = pattern.exec(content);
  if (match?.[1] === undefined) {
    return fallback;
  }

  return match[1].trim();
};

/**
 * @param {string} report
 * @returns {readonly { id: string; ruleId: string; summary: string }[]}
 */
const extractFindings = (report) => {
  const findingBlocks = report
    .split('\n### Finding ')
    .slice(1)
    .map((block) => `### Finding ${block}`);

  return findingBlocks.map((block, index) => {
    const fallbackId = `F-${String(index + 1).padStart(3, '0')}`;

    return {
      id: readFirstCapture(block, /finding_id:\s*([^\n]+)/, fallbackId),
      ruleId: readFirstCapture(block, /rule_id:\s*([^\n]+)/, 'CHK.UNKNOWN'),
      summary: readFirstCapture(
        block,
        /- why:\s*([^\n]+)/,
        'Fix the reported issue and re-validate.',
      ),
    };
  });
};

/**
 * @param {readonly { id: string; ruleId: string; summary: string }[]} findings
 * @returns {string}
 */
const buildFixPlan = (findings) => {
  const queue =
    findings.length === 0
      ? '- No findings found. Keep monitoring and re-run after any skill changes.'
      : findings
          .map((finding, index) => {
            return [
              `### Item ${index + 1}: ${finding.id} (${finding.ruleId})`,
              `- Goal: ${finding.summary}`,
              '- Files to touch: Fill after triage.',
              '- Risk level: Medium',
              '- Effort estimate: Small',
              '- Validation commands:',
              '  - node scripts/validate-skills.cjs',
              '  - node scripts/generate-skills-compliance-report.cjs',
              '- Status: not-started',
            ].join('\n');
          })
          .join('\n\n');

  return [
    '# Fix Plan',
    '',
    `Generated at: ${generatedAt}`,
    `Source report: ${path.relative(repoRoot, complianceReportPath)}`,
    '',
    '## Execution Rules',
    '',
    '- Execute one item at a time.',
    '- After each item, run validation commands and update status.',
    '- Append progress to reports/skills/agenting-plan-progress.md.',
    '- Do not start next item until current item is validated.',
    '',
    '## Queue',
    '',
    queue,
    '',
    '## Done Criteria',
    '',
    '- All items are marked done.',
    '- Skill validation passes with zero findings.',
    '- Latest compliance report has no open findings.',
  ].join('\n');
};

const buildHandoffPrompts = () => {
  return [
    '# Handoff Prompts',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Planner Agent Prompt',
    '',
    'Read reports/skills/code-smell-compliance-report.md and reports/skills/fix-plan.md.',
    'Refine the plan with exact file paths, risk level, and effort for each item.',
    'Append a progress entry to reports/skills/agenting-plan-progress.md.',
    '',
    '## Fixer Agent Prompt',
    '',
    'Execute only Item 1 from reports/skills/fix-plan.md.',
    'After changes, run validation commands listed in the plan.',
    'Append PASS or FAIL entry to reports/skills/agenting-plan-progress.md and stop.',
    '',
    '## Verifier Agent Prompt',
    '',
    'Review the fixer changes against reports/skills/fix-plan.md and the latest report.',
    'Confirm whether item scope, validations, and status updates were done correctly.',
    'Append verification outcome to reports/skills/agenting-plan-progress.md.',
  ].join('\n');
};

const buildHandoffRunbook = () => {
  return [
    '# Handoff Runbook',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Goal',
    '',
    'Run a repeatable planner -> fixer -> verifier workflow without remembering prompts.',
    '',
    '## Files Used',
    '',
    '- findings input: reports/skills/code-smell-checker-actual-repo.md',
    '- fallback findings: reports/skills/code-smell-full-audit.md',
    '- planner output: reports/skills/fix-plan.md',
    '- progress log: reports/skills/agenting-plan-progress.md',
    '',
    '## Step 1: Planner Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Read reports/skills/code-smell-checker-actual-repo.md and reports/skills/fix-plan.md.',
    'If reports/skills/code-smell-checker-actual-repo.md is missing, use reports/skills/code-smell-full-audit.md.',
    'Refine fix-plan.md with strict priority order, exact files/symbols, risk, effort, and validation commands per item.',
    'Keep one-item-at-a-time execution rules.',
    'Append PLAN-READY entry to reports/skills/agenting-plan-progress.md.',
    '```',
    '',
    'Checklist:',
    '- [ ] fix-plan.md updated',
    '- [ ] PLAN-READY appended',
    '',
    '## Step 2: Fixer Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Read reports/skills/fix-plan.md.',
    'Execute only Item 1.',
    'Run all validation commands required by that item.',
    'Append to reports/skills/agenting-plan-progress.md: item id, changed files, validation output summary, and PASS/FAIL.',
    'Stop after Item 1 and wait.',
    '```',
    '',
    'Checklist:',
    '- [ ] item 1 implemented',
    '- [ ] validations run',
    '- [ ] PASS/FAIL appended',
    '',
    '## Step 3: Verifier Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Review the Item 1 changes against reports/skills/fix-plan.md and the findings report.',
    'Confirm scope correctness and validation quality.',
    'Append VERIFIED-PASS or VERIFIED-FAIL to reports/skills/agenting-plan-progress.md.',
    '```',
    '',
    'Checklist:',
    '- [ ] verification complete',
    '- [ ] VERIFIED status appended',
    '',
    '## Step 4: Repeat',
    '',
    '- Move to Item 2 and repeat Steps 2-3.',
    '- Re-run planner only when priorities need to change.',
    '',
    '## Quick Command',
    '',
    'Refresh handoff artifacts anytime:',
    '',
    '```bash',
    'vp run skills:handoff',
    '```',
  ].join('\n');
};

const buildSourceAuditRunbook = () => {
  return [
    '# Handoff Runbook (Source Audit)',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Goal',
    '',
    'Drive remediation from full app-code smell findings in a repeatable planner -> fixer -> verifier loop.',
    '',
    '## Files Used',
    '',
    '- findings input: reports/skills/code-smell-full-audit.md',
    '- optional curated findings: reports/skills/code-smell-checker-actual-repo.md',
    '- planner output: reports/skills/fix-plan.md',
    '- progress log: reports/skills/agenting-plan-progress.md',
    '',
    '## Step 0: Refresh Findings',
    '',
    'Run:',
    '',
    '```bash',
    'vp run skills:source-audit',
    '```',
    '',
    'This single command refreshes the full source audit report and regenerates handoff artifacts (fix plan, prompts, runbooks).',
    'Confirm reports/skills/code-smell-full-audit.md exists and is recent.',
    '',
    '## Step 1: Planner Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Read reports/skills/code-smell-full-audit.md and reports/skills/fix-plan.md.',
    'Refine fix-plan.md into an executable queue using the highest severity items first.',
    'For each item, include exact file paths, symbols, risk, effort, and validation commands.',
    'Keep one-item-at-a-time execution and rollback-safe steps.',
    'Append PLAN-READY-SOURCE-AUDIT to reports/skills/agenting-plan-progress.md.',
    '```',
    '',
    'Checklist:',
    '- [ ] fix-plan.md prioritized from source audit',
    '- [ ] PLAN-READY-SOURCE-AUDIT appended',
    '',
    '## Step 2: Fixer Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Read reports/skills/fix-plan.md.',
    'Execute only Item 1 from the source-audit queue.',
    'Run all required validation commands for that item.',
    'Append SOURCE-ITEM-1 PASS/FAIL with changed files and validation summary to reports/skills/agenting-plan-progress.md.',
    'Stop and wait.',
    '```',
    '',
    'Checklist:',
    '- [ ] item 1 fixed',
    '- [ ] validations run',
    '- [ ] SOURCE-ITEM-1 status appended',
    '',
    '## Step 3: Verifier Chat',
    '',
    'Copy/paste this prompt:',
    '',
    '```text',
    'Review Item 1 changes against reports/skills/fix-plan.md and reports/skills/code-smell-full-audit.md.',
    'Confirm scope, risk mitigation, and validation quality.',
    'Append SOURCE-ITEM-1 VERIFIED-PASS or VERIFIED-FAIL to reports/skills/agenting-plan-progress.md.',
    '```',
    '',
    'Checklist:',
    '- [ ] source item verified',
    '- [ ] VERIFIED status appended',
    '',
    '## Step 4: Iterate',
    '',
    '- Repeat Steps 2-3 for next item.',
    '- Re-run planner when priorities or dependencies change.',
    '',
    '## Quick Commands',
    '',
    '```bash',
    'vp run skills:source-audit',
    '```',
  ].join('\n');
};

const appendProgress = (findingsCount) => {
  const entry = [
    `### ${generatedAt} - HANDOFF-PACK`,
    `- Action: Generated fix plan and handoff prompts from compliance findings.`,
    `- Findings in source report: ${findingsCount}`,
    '- Outputs:',
    `  - ${path.relative(repoRoot, fixPlanPath)}`,
    `  - ${path.relative(repoRoot, handoffPromptsPath)}`,
    `  - ${path.relative(repoRoot, handoffRunbookPath)}`,
    `  - ${path.relative(repoRoot, handoffSourceRunbookPath)}`,
    '',
  ].join('\n');

  if (!fs.existsSync(planProgressPath)) {
    const initial =
      '# Agenting Workflow Plan and Progress\n\n## Progress Log\n\n';
    fs.writeFileSync(planProgressPath, initial, 'utf8');
  }

  fs.appendFileSync(planProgressPath, entry, 'utf8');
};

const main = () => {
  ensureDirectory(skillsReportsDir);
  runComplianceGenerator();

  const report = readReport();
  const findings = extractFindings(report).filter(
    (finding) => finding.id !== '' && finding.ruleId !== '',
  );

  fs.writeFileSync(fixPlanPath, buildFixPlan(findings), 'utf8');
  fs.writeFileSync(handoffPromptsPath, buildHandoffPrompts(), 'utf8');
  fs.writeFileSync(handoffRunbookPath, buildHandoffRunbook(), 'utf8');
  fs.writeFileSync(handoffSourceRunbookPath, buildSourceAuditRunbook(), 'utf8');
  appendProgress(findings.length);

  console.log(`Fix plan written to ${path.relative(repoRoot, fixPlanPath)}`);
  console.log(
    `Handoff prompts written to ${path.relative(repoRoot, handoffPromptsPath)}`,
  );
  console.log(
    `Handoff runbook written to ${path.relative(repoRoot, handoffRunbookPath)}`,
  );
  console.log(
    `Source-audit runbook written to ${path.relative(repoRoot, handoffSourceRunbookPath)}`,
  );
  console.log(
    `Progress updated at ${path.relative(repoRoot, planProgressPath)}`,
  );
};

main();
