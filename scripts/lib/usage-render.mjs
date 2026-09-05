/**
 * Renders the harness usage model as markdown. Pure on purpose: the readers
 * decide what is true and this decides only how it reads.
 *
 * Two things it always prints, because a number without them misleads: the
 * source and window behind every count, and the fact that a zero is a question.
 * A caveat is rendered here rather than printed on the console, because the file
 * is what gets read later. Every cell and every interpolated reason goes through
 * one sanitiser — a newline or a pipe out of a tool this report does not control
 * ends a markdown table one row early.
 */
const TABLE_RULE = (columns) => `| ${columns.map(() => '---').join(' | ')} |`;

const inline = (value) => String(value).replaceAll(/\s+/gu, ' ').trim();

const cell = (value) => inline(value).replaceAll('|', String.raw`\|`);

const table = (columns, rows) =>
  [
    `| ${columns.map((column) => cell(column)).join(' | ')} |`,
    TABLE_RULE(columns),
    ...rows.map(
      (cells) => `| ${cells.map((value) => cell(value)).join(' | ')} |`,
    ),
  ].join('\n');

const windowLabel = (window) =>
  `${window.start} → ${window.end} (${window.days}d)`;

const skippedCount = (transcripts) => (transcripts.unreadable ?? []).length;

const skippedSuffix = (transcripts) =>
  skippedCount(transcripts) === 0
    ? ''
    : `, ${skippedCount(transcripts)} skipped as unreadable`;

const transcriptStatus = (transcripts) =>
  transcripts.available
    ? `read (${transcripts.files} transcript file(s)${skippedSuffix(transcripts)})`
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
          `> The transcript source could not be read, so no number here is an observation of absence. ${inline(transcripts.reason)}`,
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
      : `> The GitHub API could not be read, so there is no run count to report — not a run count of zero. ${inline(workflows.reason)}`,
    '',
    'GitHub retains workflow runs for a limited period, so this window is also',
    'bounded by that retention, not only by the window requested here.',
  ].join('\n');

const SHALLOW_CLONE_NOTE =
  '> **This is a shallow clone**, so `git log` sees only the commits that were fetched. Every count here is bounded by that history rather than by the window named beside it, and is a lower bound on what the window actually holds.';

const registerWindowLabel = ({ shallowClone, window }) =>
  shallowClone
    ? `${windowLabel(window)}, bounded by the fetched history`
    : windowLabel(window);

const registerRows = ({ register, shallowClone }) =>
  Object.entries(register.files)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([file, entry]) => [
      `\`${file}\``,
      String(entry.commits),
      entry.lastTouched,
      `\`git log\` over \`${register.directory}\``,
      registerWindowLabel({ shallowClone, window: register.window }),
    ]);

const registerDetail = ({ register, shallowClone }) =>
  Object.keys(register.files).length === 0
    ? '_No file in this register was touched in the window._'
    : table(
        ['File', 'Commits', 'Last touched', 'Source', 'Window'],
        registerRows({ register, shallowClone }),
      );

const registerSummary = ({ register, shallowClone }) => {
  const source = `\`git log\` over \`${register.directory}\``;
  const covers = registerWindowLabel({ shallowClone, window: register.window });
  return table(
    ['Measure', 'Value', 'Source', 'Window'],
    [
      ['Commits', String(register.commits), source, covers],
      [
        'Distinct files touched',
        String(Object.keys(register.files).length),
        source,
        covers,
      ],
      [
        'Last activity',
        register.lastActivity ?? 'none in window',
        source,
        covers,
      ],
    ],
  );
};

const registerBody = ({ register, shallowClone }) =>
  register.detail === 'per-file'
    ? registerDetail({ register, shallowClone })
    : registerSummary({ register, shallowClone });

const registerSection = ({ register, shallowClone }) =>
  [
    `## ${register.heading}`,
    '',
    register.note,
    '',
    register.available
      ? registerBody({ register, shallowClone })
      : `> This register could not be read, so there is nothing to count here — not a count of zero. ${inline(register.reason)}`,
    ...(register.available && shallowClone ? ['', SHALLOW_CLONE_NOTE] : []),
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

const transcriptWindow = (report) =>
  report.transcripts.readFrom === undefined
    ? windowLabel(report.window)
    : `${report.transcripts.readFrom} → ${report.window.end} (simulated horizon)`;

const sourceRows = (report) => [
  [
    'Claude Code transcripts',
    'skill and subagent invocations',
    transcriptWindow(report),
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
    registerWindowLabel({
      shallowClone: report.shallowClone,
      window: report.window,
    }),
    report.registers.every((register) => register.available)
      ? 'read'
      : 'NOT READ — see the register sections below',
  ],
];

const retentionAuthority = (transcripts) =>
  transcripts.retentionDeclaredIn === undefined
    ? `No \`cleanupPeriodDays\` is declared in any settings file this run could read, so Claude Code's documented default of ${transcripts.retentionDays} day(s) is assumed rather than observed`
    : `Transcripts are kept for ${transcripts.retentionDays} day(s) (\`cleanupPeriodDays\` in \`${transcripts.retentionDeclaredIn}\`)`;

const retentionSentence = (transcripts) =>
  transcripts.simulatedHorizon
    ? `**This run used a simulated transcript horizon of ${transcripts.retentionDays} day(s)** (\`--transcript-retention-days\`), so it counted no invocation dated before ${transcripts.reachBack}; the flag bounds what this run read and cannot make the store hold a day Claude Code has already deleted.`
    : `${retentionAuthority(transcripts)}, so a transcript read is guaranteed to reach back only to ${transcripts.reachBack}; every transcript still on disk was read whatever its age, which may reach further but is not promised to.`;

const snapshotSentence = (snapshot) =>
  snapshot.earliestDay === undefined
    ? 'The snapshot holds no day yet, so nothing is carried from before that.'
    : `The snapshot carries the days the transcripts have already dropped, and the earliest day it holds a record for is ${snapshot.earliestDay}.`;

const coverageSentence = ({ observedBackTo, window }) => {
  if (observedBackTo === undefined) {
    return 'No run of this report has observed any part of the window above, so a zero in the invocation counts settles nothing at all.';
  }
  if (observedBackTo <= window.start) {
    return `Runs of this report have observed the window continuously back to ${window.start}, so the invocation counts above cover it in full.`;
  }
  return `Observation runs continuously back only to ${observedBackTo}, so the earlier part of the window above is unobserved rather than empty — a zero in the invocation counts settles nothing about those days. A recorded day earlier than that is a record, not coverage.`;
};

const observationSentence = (transcripts) => {
  if (transcripts.clockOverridden) {
    return 'This run set its own clock with `--now`, so it recorded no observation of its own: what it read is the transcripts on disk today, not the ones the window above covers.';
  }
  if (transcripts.simulatedHorizon) {
    return 'This run read under a horizon it was handed rather than the retention in force, so it recorded no observation of its own: the days it covers are a choice this run made, not the days the transcripts on disk can still answer for.';
  }
  if (
    transcripts.retentionSeenSince === undefined ||
    transcripts.retentionSeenSince <= transcripts.reachBack
  ) {
    return undefined;
  }
  return `This run claims observation only from ${transcripts.retentionSeenSince}, the day the snapshot first recorded the current retention of ${transcripts.retentionDays} day(s); an earlier day fell under a setting this report never read, so this run does not vouch for it.`;
};

const unreadCoverageNote = (report) => {
  const { earliestDay } = report.transcripts.snapshot;
  const carried =
    earliestDay === undefined
      ? 'the snapshot holds no day either, so the invocation counts below are not observations of absence at all'
      : `the invocation counts below hold only what the local snapshot carries, which reaches back to ${earliestDay}`;
  return `**The transcripts could not be read**, so no part of the window above was observed through them and ${carried}. ${inline(report.transcripts.reason)}`;
};

const readCoverageNote = (report) =>
  [
    retentionSentence(report.transcripts),
    snapshotSentence(report.transcripts.snapshot),
    coverageSentence({
      observedBackTo: report.transcripts.observedBackTo,
      window: report.window,
    }),
    observationSentence(report.transcripts),
  ]
    .filter((sentence) => sentence !== undefined)
    .join(' ');

const coverageNote = (report) =>
  report.transcripts.available
    ? readCoverageNote(report)
    : unreadCoverageNote(report);

const unreadableTranscriptNote = (transcripts) =>
  skippedCount(transcripts) === 0
    ? []
    : [
        '',
        `> **${skippedCount(transcripts)} transcript path(s) could not be read in full** and were skipped, so the skill and subagent counts are a lower bound rather than a total, and this run added no day of its own to the coverage above: ${transcripts.unreadable
          .map((entry) => `\`${entry.path}\` (${inline(entry.reason)})`)
          .join('; ')}.`,
      ];

const snapshotNote = (snapshot) =>
  snapshot.setAside === undefined
    ? []
    : [
        '',
        `> **The previous snapshot could not be read**, so it was moved to \`${snapshot.setAside.movedTo}\` rather than overwritten and this run starts a new one. Until it is restored, the carried columns hold only what the transcripts still show. ${inline(snapshot.setAside.reason)}`,
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
  coverageNote(report),
  ...unreadableTranscriptNote(report.transcripts),
  ...snapshotNote(report.transcripts.snapshot),
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
    ...report.registers.flatMap((register) => [
      registerSection({ register, shallowClone: report.shallowClone }),
      '',
    ]),
    pathRuleSection(report.pathRules),
  ].join('\n')}\n`;
