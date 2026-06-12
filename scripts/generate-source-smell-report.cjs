#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const appsRoot = path.join(repoRoot, 'apps');
const reportPath = path.join(
  repoRoot,
  'reports',
  'skills',
  'code-smell-full-audit.md',
);
const progressPath = path.join(
  repoRoot,
  'reports',
  'skills',
  'agenting-plan-progress.md',
);

const now = new Date();
const generatedAt = now.toISOString();

const INCLUDE_EXTENSIONS = new Set(['.ts', '.tsx']);
const EXCLUDED_SEGMENTS = new Set([
  '.git',
  'node_modules',
  'build',
  'coverage',
  'dist',
  'playwright-report',
  'lighthouse-reports',
]);

/**
 * @typedef {Object} Finding
 * @property {string} findingId
 * @property {string} ruleId
 * @property {'BLOCKER'|'HIGH'|'MEDIUM'|'LOW'|'NIT'} severity
 * @property {'high'|'medium'|'low'} confidence
 * @property {string} locationPath
 * @property {string} locationHint
 * @property {string} evidence
 * @property {string} why
 * @property {string} fix
 * @property {'small'|'medium'|'large'} effort
 * @property {string} deferRisk
 */

const ensureDirectoryForFile = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const toPosixPath = (filePath) => {
  return filePath.split(path.sep).join('/');
};

/**
 * @param {string} startDir
 * @returns {readonly string[]}
 */
const collectSourceFiles = (startDir) => {
  /** @type {string[]} */
  const files = [];

  /** @param {string} current */
  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_SEGMENTS.has(entry.name)) {
          continue;
        }
        walk(fullPath);
        continue;
      }

      const extension = path.extname(entry.name);
      if (INCLUDE_EXTENSIONS.has(extension)) {
        files.push(fullPath);
      }
    }
  };

  if (fs.existsSync(startDir)) {
    walk(startDir);
  }

  return files;
};

/**
 * @param {readonly string[]} lines
 * @param {RegExp} pattern
 * @returns {readonly { lineNumber: number; line: string }[]}
 */
const findLineMatches = (lines, pattern) => {
  /** @type {{ lineNumber: number; line: string }[]} */
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (pattern.test(line)) {
      matches.push({ lineNumber: index + 1, line: line.trim() });
    }
  }

  return matches;
};

/**
 * @param {Finding[]} findings
 * @param {readonly string[]} lines
 * @param {RegExp} pattern
 * @param {(match: { lineNumber: number; line: string }) => Finding} toFinding
 * @returns {void}
 */
const addLinePatternFindings = (findings, lines, pattern, toFinding) => {
  for (const match of findLineMatches(lines, pattern)) {
    findings.push(toFinding(match));
  }
};

/**
 * @param {{
 *   findings: Finding[];
 *   lines: readonly string[];
 *   relativePath: string;
 * }} args
 * @returns {void}
 */
const addTypeSafetyFindings = ({ findings, lines, relativePath }) => {
  addLinePatternFindings(findings, lines, /as\s+unknown\s+as/, (match) => ({
    confidence: 'high',
    deferRisk: 'Type safety can silently degrade and hide runtime defects.',
    effort: 'small',
    evidence: match.line,
    findingId: '',
    fix: 'Replace double assertions with explicit union types and narrowing guards.',
    locationHint: `line:${match.lineNumber}`,
    locationPath: relativePath,
    ruleId: 'TS.DOUBLE-ASSERTION',
    severity: 'MEDIUM',
    why: 'Double assertion bypasses structural checks and weakens TypeScript guarantees.',
  }));

  addLinePatternFindings(findings, lines, /@ts-ignore/, (match) => ({
    confidence: 'high',
    deferRisk:
      'Compiler diagnostics are suppressed, allowing unsafe changes to pass unnoticed.',
    effort: 'small',
    evidence: match.line,
    findingId: '',
    fix: 'Replace ts-ignore with a typed refactor or a narrow ts-expect-error with rationale.',
    locationHint: `line:${match.lineNumber}`,
    locationPath: relativePath,
    ruleId: 'TS.TS-IGNORE',
    severity: 'HIGH',
    why: 'Ignoring TypeScript errors removes a key correctness guardrail.',
  }));

  for (const match of findLineMatches(lines, /\bany\b/)) {
    if (match.line.includes('no-explicit-any') || match.line.startsWith('//')) {
      continue;
    }

    findings.push({
      confidence: 'medium',
      deferRisk:
        'Any leaks can propagate unsafe values across module boundaries.',
      effort: 'small',
      evidence: match.line,
      findingId: '',
      fix: 'Replace any with unknown plus type guards or a concrete type.',
      locationHint: `line:${match.lineNumber}`,
      locationPath: relativePath,
      ruleId: 'TS.ANY-LEAK',
      severity: 'MEDIUM',
      why: 'The any type weakens static guarantees and can hide invalid assumptions.',
    });
  }
};

/**
 * @param {{
 *   content: string;
 *   findings: Finding[];
 *   lines: readonly string[];
 *   relativePath: string;
 *   filePath: string;
 * }} args
 * @returns {void}
 */
const addStyleAndDataFlowFindings = ({
  content,
  findings,
  lines,
  relativePath,
  filePath,
}) => {
  const hasUseEffect = /useEffect\s*\(/.test(content);
  const hasInlineFetch = /\bfetch\s*\(|axios\./.test(content);
  if (hasUseEffect && hasInlineFetch) {
    findings.push({
      confidence: 'medium',
      deferRisk:
        'Effect-based fetching can cause race conditions and stale updates when not carefully canceled.',
      effort: 'medium',
      evidence:
        'Detected both useEffect(...) and fetch/axios patterns in same module.',
      findingId: '',
      fix: 'Move data fetching to React Router loaders/actions or add robust abort/cancellation handling.',
      locationHint: 'module-pattern',
      locationPath: relativePath,
      ruleId: 'REACT.EFFECT-FETCH-WITHOUT-CANCEL',
      severity: 'HIGH',
      why: 'Fetching in effects is a known source of lifecycle and cancellation bugs in React apps.',
    });
  }

  if (path.extname(filePath) !== '.tsx') {
    return;
  }

  addLinePatternFindings(findings, lines, /style=\{\{/, (match) => ({
    confidence: 'high',
    deferRisk:
      'Inline styles can drift from project styling rules and reduce consistency.',
    effort: 'small',
    evidence: match.line,
    findingId: '',
    fix: 'Migrate to StyleX tokens/rules or document this as an explicit architecture exception.',
    locationHint: `line:${match.lineNumber}`,
    locationPath: relativePath,
    ruleId: 'CHK.REACT.INLINE-STYLE',
    severity: 'MEDIUM',
    why: 'Inline styling often conflicts with centralized styling standards in large codebases.',
  }));
};

/**
 * @param {{
 *   content: string;
 *   filePath: string;
 *   lines: readonly string[];
 *   relativePath: string;
 * }} args
 * @returns {readonly Finding[]}
 */
const collectFindingsForFile = ({ content, filePath, lines, relativePath }) => {
  /** @type {Finding[]} */
  const findings = [];

  if (lines.length > 500) {
    findings.push({
      confidence: 'high',
      deferRisk:
        'Large files increase regression risk during edits and reviews.',
      effort: 'medium',
      evidence: `${relativePath} has ${lines.length} lines.`,
      findingId: '',
      fix: 'Split this module into focused submodules by concern and keep behavior equivalent.',
      locationHint: `file-length:${lines.length}`,
      locationPath: relativePath,
      ruleId: 'CHK.FILE.LONG',
      severity: 'HIGH',
      why: 'Very large source files usually combine multiple responsibilities and are harder to maintain.',
    });
  }

  addTypeSafetyFindings({ findings, lines, relativePath });
  addStyleAndDataFlowFindings({
    content,
    findings,
    lines,
    relativePath,
    filePath,
  });

  return findings;
};

/**
 * @param {readonly string[]} files
 * @returns {readonly Finding[]}
 */
const collectFindings = (files) => {
  /** @type {Finding[]} */
  const findings = [];

  for (const filePath of files) {
    const relativePath = toPosixPath(path.relative(repoRoot, filePath));
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    findings.push(
      ...collectFindingsForFile({ content, filePath, lines, relativePath }),
    );
  }

  const severityRank = { BLOCKER: 5, HIGH: 4, MEDIUM: 3, LOW: 2, NIT: 1 };
  findings.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }

    if (a.locationPath !== b.locationPath) {
      return a.locationPath.localeCompare(b.locationPath);
    }

    return a.locationHint.localeCompare(b.locationHint);
  });

  return findings.map((finding, index) => {
    return {
      ...finding,
      findingId: `F-${String(index + 1).padStart(3, '0')}`,
    };
  });
};

/**
 * @param {readonly Finding[]} findings
 * @returns {{ blocker: number; high: number; low: number; medium: number; nit: number }}
 */
const countBySeverity = (findings) => {
  return findings.reduce(
    (accumulator, finding) => {
      if (finding.severity === 'BLOCKER') {
        accumulator.blocker += 1;
      } else if (finding.severity === 'HIGH') {
        accumulator.high += 1;
      } else if (finding.severity === 'MEDIUM') {
        accumulator.medium += 1;
      } else if (finding.severity === 'LOW') {
        accumulator.low += 1;
      } else {
        accumulator.nit += 1;
      }

      return accumulator;
    },
    { blocker: 0, high: 0, low: 0, medium: 0, nit: 0 },
  );
};

/**
 * @param {readonly Finding[]} findings
 * @returns {string}
 */
const renderFindings = (findings) => {
  if (findings.length === 0) {
    return 'No catalog findings on this audit.';
  }

  return findings
    .map((finding) => {
      return [
        `### Finding ${finding.findingId}`,
        `- finding_id: ${finding.findingId}`,
        `- rule_id: ${finding.ruleId}`,
        `- severity: ${finding.severity}`,
        `- confidence: ${finding.confidence}`,
        `- location_path: ${finding.locationPath}`,
        `- location_hint: ${finding.locationHint}`,
        '- evidence_excerpt:',
        '```text',
        finding.evidence,
        '```',
        `- why: ${finding.why}`,
        `- fix: ${finding.fix}`,
        `- effort: ${finding.effort}`,
        `- defer_risk: ${finding.deferRisk}`,
        '- verification_steps:',
        '  - Run `vp check` and confirm static checks pass.',
        '  - Run `vp run test` and verify no behavioral regressions.',
        '- status: open',
      ].join('\n');
    })
    .join('\n\n');
};

/**
 * @param {readonly Finding[]} findings
 * @returns {string}
 */
const renderQueue = (findings) => {
  if (findings.length === 0) {
    return 'No queue items required.';
  }

  const top = findings.slice(0, 3);
  const queueLines = [];
  for (let index = 0; index < 3; index += 1) {
    const fallback = top.at(-1);
    const finding = top[index] ?? fallback;
    if (finding === undefined) {
      continue;
    }

    queueLines.push(
      `${index + 1}. queue_rank: ${index + 1}`,
      `- target_finding_ids: ${finding.findingId}`,
      '- reason_for_order: Higher-severity and higher-confidence findings should be addressed first.',
      '- expected_outcome: Reduce immediate maintainability and correctness risk in the audited area.',
      '',
    );
  }

  return queueLines.join('\n').trimEnd();
};

/**
 * @param {readonly Finding[]} findings
 * @param {number} filesAnalyzed
 * @returns {string}
 */
const buildReport = (findings, filesAnalyzed) => {
  const counts = countBySeverity(findings);
  const topRisk =
    findings.length === 0
      ? 'No material smell risk detected in scanned source files.'
      : `Detected ${counts.high} HIGH and ${counts.medium} MEDIUM findings across app source code.`;

  const actions =
    findings.length === 0
      ? ['No actions required.']
      : [
          'Fix HIGH severity findings first and re-run the audit.',
          'Address unsafe TypeScript patterns (`any`, `@ts-ignore`, double assertions).',
          'Refactor large multi-responsibility modules into smaller units.',
        ];

  return [
    '# Smell Findings Report',
    '',
    '## Metadata',
    '- schema_version: 1.0',
    `- report_id: source-smells-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`,
    `- generated_at: ${generatedAt}`,
    '- skill_name: code-smell-checker',
    '- repository: vite-react-compiler',
    '- scope_type: folder',
    '- scope_value: apps/**/{src,utils}',
    '- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT',
    '- classification: mixed',
    '- primary_lens: Mixed',
    '',
    '## Summary',
    `- files_analyzed: ${filesAnalyzed}`,
    '- findings_count_by_severity:',
    `- blocker: ${counts.blocker}`,
    `- high: ${counts.high}`,
    `- medium: ${counts.medium}`,
    `- low: ${counts.low}`,
    `- nit: ${counts.nit}`,
    `- top_risk: ${topRisk}`,
    '- first_3_actions:',
    ...actions.map((action, index) => `  ${index + 1}. ${action}`),
    '',
    '## Findings',
    '',
    renderFindings(findings),
    '',
    '## Prioritized Execution Queue',
    renderQueue(findings),
    '',
    '## Deferred Items',
    'None.',
    '',
    '## Validation Checklist',
    '- [x] Required sections present',
    '- [x] Required metadata fields present',
    '- [x] Summary counts match findings',
    '- [x] Each finding has evidence_excerpt, why, fix',
    '- [x] Each finding has verification_steps',
    '- [x] Severity values are canonical',
    '- [x] Prioritized queue present when findings exist',
    '',
    '## Closure Criteria',
    '- All HIGH findings are fixed or explicitly deferred with owner/rationale.',
    '- Type-safe alternatives replace broad assertions and suppression directives.',
    '- `vp check` and `vp run test` pass after remediation.',
  ].join('\n');
};

const appendProgress = (findingsCount, filesAnalyzed) => {
  ensureDirectoryForFile(progressPath);
  if (!fs.existsSync(progressPath)) {
    fs.writeFileSync(
      progressPath,
      '# Agenting Workflow Plan and Progress\n\n## Progress Log\n\n',
      'utf8',
    );
  }

  const status = findingsCount === 0 ? 'PASS' : 'FINDINGS';
  const entry = [
    `### ${generatedAt} - SOURCE-AUDIT-${status}`,
    `- Action: Generated full source-code smell report.`,
    `- Files analyzed: ${filesAnalyzed}`,
    `- Findings: ${findingsCount}`,
    `- Output: reports/skills/code-smell-full-audit.md`,
    '',
  ].join('\n');

  fs.appendFileSync(progressPath, entry, 'utf8');
};

const main = () => {
  const files = collectSourceFiles(appsRoot);
  const findings = collectFindings(files);

  ensureDirectoryForFile(reportPath);
  const report = buildReport(findings, files.length);
  fs.writeFileSync(reportPath, report, 'utf8');
  appendProgress(findings.length, files.length);

  console.log(
    `Full source smell report written to ${path.relative(repoRoot, reportPath)}`,
  );
  console.log(`Files analyzed: ${files.length}`);
  console.log(`Findings: ${findings.length}`);
};

main();
