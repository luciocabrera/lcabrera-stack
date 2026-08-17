import { describe, expect, it } from 'vite-plus/test';

import {
  REVIEW_DECLINED,
  REVIEW_WITH_NO_SUPPRESSED,
  REVIEW_WITH_ONE_SUPPRESSED,
  REVIEW_WITH_THREE_SUPPRESSED,
} from './copilot-suppressed-fixtures.mjs';
import {
  SUMMARY_INDENT,
  suppressedHeadline,
  suppressedLines,
  suppressedMarkdown,
  suppressedStatusNote,
  withStatusNote,
} from './copilot-suppressed-report.mjs';
import { collectSuppressedComments } from './copilot-suppressed.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

// What this file holds in place is that no rendering path can print a bare `0`,
// or a count with no state attached to it. Every reader of this output — the
// terminal, the job summary, the commit status — has to be able to tell "Copilot
// suppressed nothing" from "nothing could be read".

/** GitHub truncates a commit-status description past this. */
const DESCRIPTION_LIMIT = 140;

/**
 * A line as the CONSUMERS end one, which is what the guards below have to be
 * asserted against. CommonMark and .NET's line readers both end a line at a bare
 * `\r`; splitting these assertions on `\n` alone would call a line safe because
 * the test agreed with the bug about where lines end.
 */
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
    // The two zeros mean opposite things and both used to render as "0".
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
    // Otherwise "no suppressed comments" reads as "Copilot found nothing to
    // suppress", when in fact Copilot read nothing at all.
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
    // The line number in a finding is the one Copilot saw, on a commit the pull
    // request has usually moved past. The quoted source is what survives that.
    const lines = suppressedLines(FOUND, { pr: 740 });
    expect(lines).toContain(
      '    | gh run list --workflow=review-gate-reconcile.yml --limit 5',
    );
  });

  it('gives untrusted review text no line of its own', () => {
    // A suppressed comment quotes the diff, and this output reaches a runner's
    // stdout, where a `::` at the start of a line is a workflow command.
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
    // A snippet is the one thing here that keeps its newlines, so flattening
    // cannot be the guard — and the runner matches `::` on the TRIMMED line, so
    // indentation is not one either. Only the visible prefix stops this.
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
    // A line ending the renderer does not split on is a line it does not
    // transform, so the remainder arrives unprefixed — the same defect as a
    // fence the input can close, one layer down.
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

/** A line this renderer emits itself, as opposed to one taken from a review. */
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
    // Two spaces put it inside the list item; four more make it a code block.
    // The blank line either side is what opens and closes one, so both are part
    // of the assertion rather than formatting.
    expect(markdown).toContain(
      `\n\n${SUMMARY_INDENT}gh run list --workflow=review-gate-reconcile.yml --limit 5\n\n`,
    );
  });

  it('cannot be escaped by the source it quotes', () => {
    // A fence closes on any line of at least as many backticks, so a four-tick
    // fence was ended by four-tick quoted source and the rest of the quote
    // rendered as Markdown — a checked `- [x]` among the findings, in a list
    // where an unchecked box is what "unanswered" means. Every line of quoted
    // source is indented instead, and an indented block has no delimiter to
    // imitate.
    const hostile = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'PR_HEAD=$(gh pr view <n> --json headRefOid --jq .headRefOid) \\',
        '````\n## injected heading\n- [x] fake resolved',
      ),
    };
    const report = collectSuppressedComments([hostile]);
    const lines = consumerLines(suppressedMarkdown(report, { pr: 1 }));

    // The total assertion: no line of quoted source reaches the document at an
    // indentation where Markdown would read it as anything.
    expect(
      lines.filter(
        (line) => !rendererLine(line) && !line.startsWith(SUMMARY_INDENT),
      ),
    ).toEqual([]);

    // And the quote is still there, in full, rather than dropped or mangled.
    expect(lines).toContain(`${SUMMARY_INDENT}- [x] fake resolved`);
    expect(lines).toContain(`${SUMMARY_INDENT}## injected heading`);
    expect(lines).toContain(`${SUMMARY_INDENT}\`\`\`\``);

    // Width-independent, and the reason the assertion above is not enough on its
    // own: a longer fence passes any test whose planted input is shorter, so
    // what is asserted is that the container has NO delimiter to outrun. The
    // only backtick-only line in the document is the one the quote itself
    // carries.
    expect(lines.filter((line) => /^\s*`+\s*$/u.test(line))).toEqual([
      `${SUMMARY_INDENT}\`\`\`\``,
    ]);
  });

  it('indents every line, on every line ending, not only on newlines', () => {
    // Rendered through GitHub's own Markdown (`POST /markdown`, `mode: gfm`)
    // before this was fixed, an unsplit bare carriage return produced
    // `aria-label="Completed task" checked=""` — a forged tick in a checklist
    // where an unticked box is what "unanswered" means.
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
    // Asserted on the closing line, not on the document as a whole: the findings
    // themselves quote file paths, so `toContain` over the whole summary would
    // pass on a fixture that happens to mention the doc.
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
    // The reconcile sweep records a gate's LAST line as its outcome for that
    // pull request — the line about the status being posted or withheld, which
    // follows the verdict. Reporting above the verdict is above both, so no
    // finding can take that line's place, and nothing else would notice if one
    // did.
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
    // What this pins is that an over-long result is cut and marked — not that
    // the note survives, because at exactly the limit the cut tail IS the note.
    // That case is unreachable: every verdict `decideReviewStatus` produces
    // leaves room, and the test above is the one asserting the note is present.
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
  /** A line ending plus a forged checklist tick and a runner directive. */
  const HOSTILE = '\r- [x] answered: no action needed\r::error::planted';

  const HOSTILE_FIELDS = {
    line: `1${HOSTILE}`,
    path: `docs/x.md${HOSTILE}`,
    review: `4950971288${HOSTILE}`,
    snippet: `quoted${HOSTILE}`,
    submittedAt: `2026-08-17T11:13:52Z${HOSTILE}`,
    text: `a finding${HOSTILE}`,
  };

  const reportWith = (field) => {
    const report = collectSuppressedComments([REVIEW_WITH_ONE_SUPPRESSED]);
    const comments = report.comments.map((comment) => ({
      ...comment,
      [field]: HOSTILE_FIELDS[field],
    }));
    return {
      ...report,
      comments,
      findings: report.findings.map((finding) => ({
        ...finding,
        ...(field === 'path' || field === 'line'
          ? { [field]: HOSTILE_FIELDS[field] }
          : {}),
        occurrences: comments,
      })),
    };
  };

  it('covers every field, so adding one without a case fails here', () => {
    // The row that would otherwise be missing is exactly the defect this suite
    // kept finding one field late.
    const [comment] = collectSuppressedComments([
      REVIEW_WITH_ONE_SUPPRESSED,
    ]).comments;
    expect(Object.keys(comment).sort()).toEqual(
      Object.keys(HOSTILE_FIELDS).sort(),
    );
  });

  for (const field of Object.keys(HOSTILE_FIELDS)) {
    it(`contains a hostile ${field} in the job summary`, () => {
      const lines = consumerLines(
        suppressedMarkdown(reportWith(field), { pr: 1 }),
      );
      expect(
        lines.filter(
          (line) => !rendererLine(line) && !line.startsWith(SUMMARY_INDENT),
        ),
      ).toEqual([]);
    });

    it(`contains a hostile ${field} on stdout`, () => {
      const lines = consumerLines(
        suppressedLines(reportWith(field), { pr: 1 }),
      );
      expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
    });
  }
});
