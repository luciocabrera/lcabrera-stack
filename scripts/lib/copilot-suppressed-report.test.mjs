import { describe, expect, it } from 'vite-plus/test';

import {
  REVIEW_DECLINED,
  REVIEW_WITH_NO_SUPPRESSED,
  REVIEW_WITH_ONE_SUPPRESSED,
  REVIEW_WITH_THREE_SUPPRESSED,
} from './copilot-suppressed-fixtures.mjs';
import {
  MARKERS,
  SUMMARY_INDENT,
  suppressedHeadline,
  suppressedLines,
  suppressedMarkdown,
  suppressedStatusNote,
  withStatusNote,
} from './copilot-suppressed-report.mjs';
import { collectSuppressedComments } from './copilot-suppressed.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

const DESCRIPTION_LIMIT = 140;

const CONSUMER_LINE_ENDING = /\r\n|[\n\r]/u;

const consumerLines = (text) =>
  (Array.isArray(text) ? text : [text]).flatMap((line) =>
    line.split(CONSUMER_LINE_ENDING),
  );

const FOUND = collectSuppressedComments([
  REVIEW_WITH_ONE_SUPPRESSED,
  REVIEW_WITH_THREE_SUPPRESSED,
]);
const NONE = collectSuppressedComments([REVIEW_WITH_NO_SUPPRESSED]);
const NO_REVIEWS = collectSuppressedComments([]);
const UNREADABLE = collectSuppressedComments([
  { ...REVIEW_WITH_NO_SUPPRESSED, body: 'reviewed, remarks inline' },
]);

describe('the headline', () => {
  it('names the pull request and both counts when there are findings', () => {
    const headline = suppressedHeadline(FOUND, { pr: 740 });
    expect(headline).toContain('#740');
    expect(headline).toContain('4 suppressed findings');
    expect(headline).toContain('4 comments');
    expect(headline).toContain('2 Copilot reviews');
  });

  it('says which zero it is', () => {
    expect(suppressedHeadline(NONE, { pr: 746 })).toContain(
      'no suppressed comments in 1 Copilot review',
    );
    expect(suppressedHeadline(NO_REVIEWS, { pr: 754 })).toContain(
      'no Copilot review to read',
    );
    expect(suppressedHeadline(UNREADABLE, { pr: 1 })).toContain(
      'could NOT be read',
    );
    expect(suppressedHeadline(UNREADABLE, { pr: 1 })).toContain('not as zero');
  });

  it('says when Copilot declined the review outright', () => {
    const declined = collectSuppressedComments([REVIEW_DECLINED]);
    expect(suppressedHeadline(declined, { pr: 747 })).toContain(
      'declined 1 review',
    );
    expect(suppressedHeadline(NONE, { pr: 746 })).not.toContain('declined');
  });
});

describe('the terminal report', () => {
  it('lists every finding with its location and latest wording', () => {
    const lines = suppressedLines(FOUND, { pr: 740 }).join('\n');
    expect(lines).toContain('docs/tooling/copilot-review-gate.md:149');
    expect(lines).toContain('.github/workflows/copilot-review-gate.yml:92');
    expect(lines).toContain('review 4951170361');
  });

  it('prints the source Copilot quoted, so a moved line is still findable', () => {
    const lines = suppressedLines(FOUND, { pr: 740 });
    expect(lines).toContain(
      '    | gh run list --workflow=review-gate-reconcile.yml --limit 5',
    );
  });

  it('gives untrusted review text no line of its own', () => {
    const injected = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'The “Without a checkout”',
        'text\n::error::planted\n',
      ),
    };
    const lines = consumerLines(
      suppressedLines(collectSuppressedComments([injected])),
    );
    expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
    expect(lines.join('\n')).toContain('::error::planted');
  });

  it('keeps a directive inside quoted source off the start of a line', () => {
    const injected = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'PR_HEAD=$(gh pr view <n> --json headRefOid --jq .headRefOid) \\',
        '::error::planted in a snippet',
      ),
    };
    const lines = consumerLines(
      suppressedLines(collectSuppressedComments([injected])),
    );
    expect(lines.join('\n')).toContain('::error::planted in a snippet');
    expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
  });

  it('prefixes every line, on every line ending, not only on newlines', () => {
    const injected = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'PR_HEAD=$(gh pr view <n> --json headRefOid --jq .headRefOid) \\',
        'first segment\r::error::planted after a bare carriage return',
      ),
    };
    const lines = consumerLines(
      suppressedLines(collectSuppressedComments([injected])),
    );
    expect(lines.join('\n')).toContain('::error::planted');
    expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
  });

  it('reports a problem before it reports a count', () => {
    const lines = suppressedLines(UNREADABLE, { pr: 1 });
    expect(lines[0]).toContain('could NOT be read');
    expect(lines[1]).toContain('no known Copilot review shape');
  });
});

const rendererLine = (line) =>
  line === '' ||
  line === '### Copilot suppressed comments' ||
  line.startsWith('- [ ] ') ||
  line.startsWith('#1:') ||
  line.startsWith('#740:') ||
  line.startsWith('These are review findings');

describe('the job summary', () => {
  it('renders one checkbox per finding, under its own heading', () => {
    const markdown = suppressedMarkdown(FOUND, { pr: 740 });
    expect(markdown).toContain('### Copilot suppressed comments');
    expect(markdown.match(/^- \[ ] /gm)).toHaveLength(FOUND.findings.length);
    expect(markdown).toContain('docs/tooling/copilot-review-gate.md');
  });

  it('indents the quoted source into the checkbox it belongs to', () => {
    const markdown = suppressedMarkdown(FOUND, { pr: 740 });
    expect(markdown).toContain(
      `\n\n${SUMMARY_INDENT}gh run list --workflow=review-gate-reconcile.yml --limit 5\n\n`,
    );
  });

  it('cannot be escaped by the source it quotes', () => {
    const hostile = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'PR_HEAD=$(gh pr view <n> --json headRefOid --jq .headRefOid) \\',
        '````\n## injected heading\n- [x] fake resolved',
      ),
    };
    const report = collectSuppressedComments([hostile]);
    const lines = consumerLines(suppressedMarkdown(report, { pr: 1 }));

    expect(
      lines.filter(
        (line) => !rendererLine(line) && !line.startsWith(SUMMARY_INDENT),
      ),
    ).toEqual([]);

    expect(lines).toContain(`${SUMMARY_INDENT}- [x] fake resolved`);
    expect(lines).toContain(`${SUMMARY_INDENT}## injected heading`);
    expect(lines).toContain(`${SUMMARY_INDENT}\`\`\`\``);

    expect(lines.filter((line) => /^\s*`+\s*$/u.test(line))).toEqual([
      `${SUMMARY_INDENT}\`\`\`\``,
    ]);
  });

  it('indents every line, on every line ending, not only on newlines', () => {
    const hostile = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'PR_HEAD=$(gh pr view <n> --json headRefOid --jq .headRefOid) \\',
        'first segment\r- [x] fake resolved',
      ),
    };
    const lines = consumerLines(
      suppressedMarkdown(collectSuppressedComments([hostile]), { pr: 1 }),
    );
    expect(lines).toContain(`${SUMMARY_INDENT}- [x] fake resolved`);
    expect(
      lines.filter(
        (line) => !rendererLine(line) && !line.startsWith(SUMMARY_INDENT),
      ),
    ).toEqual([]);
  });

  it('says the findings do not block, and where that is decided', () => {
    const closing = suppressedMarkdown(FOUND, { pr: 740 }).split('\n').at(-1);
    expect(closing).toContain('do not block the merge');
    expect(closing).toContain('docs/tooling/copilot-review-gate.md');
  });

  it('renders the problems when there is nothing else to render', () => {
    const markdown = suppressedMarkdown(UNREADABLE, { pr: 1 });
    expect(markdown).toContain('⚠');
    expect(markdown).not.toContain('- [ ]');
  });
});

describe('where the gate prints this', () => {
  it('keeps the suppressed report above the verdict the gate prints', () => {
    const source = readRepoFile('scripts/copilot-review-status.mjs');
    const report = source.indexOf('reportSuppressed(suppressed');
    const verdict = source.indexOf('console.log(verdictLine(');
    expect(report).toBeGreaterThan(0);
    expect(verdict).toBeGreaterThan(report);
  });
});

describe('the clause the commit status carries', () => {
  it('is absent for a clean read, and present for both other answers', () => {
    expect(suppressedStatusNote(NONE)).toBeUndefined();
    expect(suppressedStatusNote(NO_REVIEWS)).toBeUndefined();
    expect(suppressedStatusNote(FOUND)).toContain('4 suppressed findings');
    expect(suppressedStatusNote(UNREADABLE)).toContain('unreadable');
  });

  it('names the command that lists them, since a status has no room for them', () => {
    expect(suppressedStatusNote(FOUND)).toContain('copilot-review:suppressed');
  });

  it('leaves the verdict alone when there is nothing to add', () => {
    const verdict = 'Copilot reviewed dd8fb78, the current head.';
    expect(withStatusNote(verdict, undefined)).toBe(verdict);
    expect(withStatusNote(verdict, suppressedStatusNote(NONE))).toBe(verdict);
  });

  it('appends within the length GitHub keeps', () => {
    const verdict = 'Copilot reviewed dd8fb78, the current head.';
    const described = withStatusNote(verdict, suppressedStatusNote(FOUND));
    expect(described.startsWith(verdict)).toBe(true);
    expect(described).toContain('4 suppressed findings');
    expect(described.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
  });

  it('cuts the tail rather than silently returning the verdict alone', () => {
    const long = 'x'.repeat(DESCRIPTION_LIMIT);
    const described = withStatusNote(long, suppressedStatusNote(FOUND));
    expect(described.length).toBe(DESCRIPTION_LIMIT);
    expect(described.endsWith('…')).toBe(true);
  });
});

// One hostile case per value a review contributes, because guarding them one at
// a time is what let three of them escape in turn. The assertion is the same
// containment check the tests above use; what was missing was ever pointing it
// at the location, so it is now pointed at everything, from a table whose
// coverage is itself asserted.
describe('containment, for every value a review contributes', () => {
  const TRAILING = '\r- [x] answered: no action needed\r::error::planted';
  const LEADING = '::error::forged';

  const BENIGN = {
    line: '1',
    path: 'docs/x.md',
    review: '4950971288',
    snippet: 'quoted',
    submittedAt: '2026-08-17T11:13:52Z',
    text: 'a finding',
  };

  const SHAPES = {
    appends: (benign) => `${benign}${TRAILING}`,
    begins: (benign) => `${LEADING}${benign}`,
  };

  const reportWith = (field, shape) => {
    const hostile = SHAPES[shape](BENIGN[field]);
    const report = collectSuppressedComments([REVIEW_WITH_ONE_SUPPRESSED]);
    const comments = report.comments.map((comment) => ({
      ...comment,
      [field]: hostile,
    }));
    return {
      ...report,
      comments,
      findings: report.findings.map((finding) => ({
        ...finding,
        ...(field === 'path' || field === 'line' ? { [field]: hostile } : {}),
        occurrences: comments,
      })),
    };
  };

  it('covers every field, so adding one without a case fails here', () => {
    const [comment] = collectSuppressedComments([
      REVIEW_WITH_ONE_SUPPRESSED,
    ]).comments;
    expect(Object.keys(comment).sort()).toEqual(Object.keys(BENIGN).sort());
  });

  for (const field of Object.keys(BENIGN)) {
    for (const shape of Object.keys(SHAPES)) {
      it(`contains a hostile ${field} that ${shape} the payload, in the job summary`, () => {
        const lines = consumerLines(
          suppressedMarkdown(reportWith(field, shape), { pr: 1 }),
        );
        expect(
          lines.filter(
            (line) => !rendererLine(line) && !line.startsWith(SUMMARY_INDENT),
          ),
        ).toEqual([]);
      });

      it(`contains a hostile ${field} that ${shape} the payload, on stdout`, () => {
        const lines = consumerLines(
          suppressedLines(reportWith(field, shape), { pr: 1 }),
        );
        expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
      });
    }
  }

  it('starts every line it emits with a marker of its own', () => {
    const report = collectSuppressedComments([
      REVIEW_WITH_ONE_SUPPRESSED,
      REVIEW_WITH_THREE_SUPPRESSED,
    ]);
    const [headline, ...rest] = suppressedLines(
      { ...report, problems: ['a problem'] },
      { pr: 740 },
    );
    expect(headline.startsWith('#740:')).toBe(true);
    const markers = Object.values(MARKERS);
    expect(
      rest.filter(
        (line) => !markers.some((marker) => line.trim().startsWith(marker)),
      ),
    ).toEqual([]);
  });
});
