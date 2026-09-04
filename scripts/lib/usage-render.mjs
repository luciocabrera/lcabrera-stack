/**
 * Renders the harness usage model as markdown.
 *
 * Pure on purpose: the readers decide what is true and this decides only how it
 * reads, so the wording of a caveat can be reviewed without running anything.
 *
 * Two things it always prints, because a number without them misleads: the
 * source and window behind every count, and the fact that a count of zero is a
 * question rather than a verdict.
 */
const TABLE_RULE = (columns) => `| ${columns.map(() => '---').join(' | ')} |`;

const table = (columns, rows) =>
  [
    `| ${columns.join(' | ')} |`,
    TABLE_RULE(columns),
    ...rows.map((cells) => `| ${cells.join(' | ')} |`),
  ].join('\n');

const windowLabel = (window) =>
  `${window.start} → ${window.end} (${window.days}d)`;

const transcriptStatus = (transcripts) =>
  transcripts.available
    ? `read (${transcripts.files} transcript file(s))`
    : `NOT READ — ${transcripts.reason}`;

const countCell = (transcripts, row) =>
  transcripts.available || row.total > 0 ? String(row.total) : 'not read';

const invocationRows = (transcripts, rows) =>
  rows.map((row) => [
    row.inInventory ? `\`${row.name}\`` : `\`${row.name}\` (not in this repo)`,
    countCell(transcripts, row),
    transcripts.available ? String(row.fromTranscripts) : 'not read',
    String(row.carriedFromSnapshot),
    'Claude Code transcripts + local snapshot',
    windowLabel(row.window),
  ]);

const INVOCATION_COLUMNS = [
  'Name',
  'Invocations',
  'From transcripts',
  'From snapshot',
  'Source',
  'Window',
];

const invocationSection = ({ heading, rows, transcripts }) =>
  [
    `## ${heading}`,
    '',
    table(INVOCATION_COLUMNS, invocationRows(transcripts, rows)),
    ...(transcripts.available
      ? []
      : [
          '',
          `> The transcript source could not be read, so no number here is an observation of absence. ${transcripts.reason}`,
        ]),
  ].join('\n');

const workflowRows = (workflows) =>
  workflows.rows.map((row) => [
    `\`${row.file}\``,
    row.count === undefined ? `not read — ${row.reason}` : String(row.count),
    'GitHub Actions run history (`gh api`)',
    windowLabel(row.window),
  ]);

const workflowSection = (workflows) =>
  [
    '## Workflows',
    '',
    workflows.available
      ? table(['Workflow', 'Runs', 'Source', 'Window'], workflowRows(workflows))
      : `> The GitHub API could not be read, so there is no run count to report — not a run count of zero. ${workflows.reason}`,
    '',
    'GitHub retains workflow runs for a limited period, so this window is also',
    'bounded by that retention, not only by the window requested here.',
  ].join('\n');

const registerRows = (register) =>
  Object.entries(register.files)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([file, entry]) => [
      `\`${file}\``,
      String(entry.commits),
      entry.lastTouched,
      `\`git log\` over \`${register.directory}\``,
      windowLabel(register.window),
    ]);

const registerDetail = (register) =>
  Object.keys(register.files).length === 0
    ? '_No file in this register was touched in the window._'
    : table(
        ['File', 'Commits', 'Last touched', 'Source', 'Window'],
        registerRows(register),
      );

const registerSummary = (register) =>
  table(
    ['Measure', 'Value', 'Source', 'Window'],
    [
      [
        'Commits',
        String(register.commits),
        `\`git log\` over \`${register.directory}\``,
        windowLabel(register.window),
      ],
      [
        'Distinct files touched',
        String(Object.keys(register.files).length),
        `\`git log\` over \`${register.directory}\``,
        windowLabel(register.window),
      ],
      [
        'Last activity',
        register.lastActivity ?? 'none in window',
        `\`git log\` over \`${register.directory}\``,
        windowLabel(register.window),
      ],
    ],
  );

const registerSection = (register) =>
  [
    `## ${register.heading}`,
    '',
    register.note,
    '',
    register.available
      ? register.detail === 'per-file'
        ? registerDetail(register)
        : registerSummary(register)
      : `> This register could not be read, so there is nothing to count here — not a count of zero. ${register.reason}`,
  ].join('\n');

const pathRuleSection = (pathRules) =>
  [
    '## Path rules — not measurable, deliberately',
    '',
    'A path rule is loaded by glob whenever a matching file is opened. Nothing',
    'invokes it by name, so there is no invocation to count, and this report',
    'gives these rules no number rather than a misleading one.',
    '',
    'The available proxy — the violation rate of the gate behind a rule — reads',
    'the same at both ends: a rule everyone has internalised and a rule nobody',
    'reads both produce no violations. Those are opposite conclusions from',
    'identical data, so the proxy is not evidence and is not reported.',
    '',
    table(
      ['Path rule', 'Usage', 'Why'],
      pathRules.map((name) => [
        `\`.claude/rules/${name}\``,
        'not measurable',
        'auto-loaded by glob; no invocation is recorded',
      ]),
    ),
  ].join('\n');

const sourceRows = (report) => [
  [
    'Claude Code transcripts',
    'skill and subagent invocations',
    windowLabel(report.window),
    transcriptStatus(report.transcripts),
  ],
  [
    'Local snapshot',
    'skill and subagent days the transcripts no longer hold',
    report.transcripts.snapshot.earliestDay === undefined
      ? 'empty so far'
      : `from ${report.transcripts.snapshot.earliestDay}`,
    `\`${report.transcripts.snapshot.path}\``,
  ],
  [
    'GitHub Actions (`gh api`)',
    'workflow runs',
    windowLabel(report.window),
    report.workflows.available
      ? 'read'
      : `NOT READ — ${report.workflows.reason}`,
  ],
  [
    '`git log`',
    'requirement and coordination register activity',
    windowLabel(report.window),
    report.registers.every((register) => register.available)
      ? 'read'
      : 'NOT READ — see the register sections below',
  ],
];

const header = (report) => [
  '# Harness usage',
  '',
  `Generated ${report.generatedAt} by \`${report.command}\`. Produced on demand and`,
  'never committed (ADR-049); re-run the command rather than quoting a number',
  'from it anywhere that is tracked.',
  '',
  '## How to read this',
  '',
  '**A zero is a question, not a verdict.** Three causes end differently, and',
  'the number alone does not tell you which one you have:',
  '',
  '1. The description does not trigger — a reachability defect. Fix the',
  '   description and measure again.',
  '2. The job moved somewhere else. Delete the part and leave a pointer to',
  '   whatever now does the job.',
  '3. It is genuinely unneeded. Delete it.',
  '',
  '**Transcripts are local and Claude-only.** Copilot and Gemini leave none, and',
  'a transcript recorded on another machine is not visible here. Skill and',
  'subagent counts therefore describe this machine, so a low number is partial',
  'coverage before it is evidence of absence.',
  '',
  report.transcripts.simulatedHorizon
    ? `**This run used a simulated transcript horizon of ${report.transcripts.retentionDays} day(s)** (\`--transcript-retention-days\`), so the transcript columns show less than the machine holds. The totals still include everything the snapshot carries.`
    : `Transcripts are kept for ${report.transcripts.retentionDays} day(s) (\`cleanupPeriodDays\` in \`.claude/settings.json\`); the snapshot carries what falls off.`,
  '',
  '## Sources',
  '',
  table(['Source', 'Answers', 'Window', 'Status'], sourceRows(report)),
];

export const renderReport = (report) =>
  `${[
    ...header(report),
    '',
    invocationSection({
      heading: 'Skills',
      rows: report.skills,
      transcripts: report.transcripts,
    }),
    '',
    invocationSection({
      heading: 'Subagents',
      rows: report.subagents,
      transcripts: report.transcripts,
    }),
    '',
    workflowSection(report.workflows),
    '',
    ...report.registers.flatMap((register) => [registerSection(register), '']),
    pathRuleSection(report.pathRules),
  ].join('\n')}\n`;
