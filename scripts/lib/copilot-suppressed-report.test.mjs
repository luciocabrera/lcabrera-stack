import { describe, expect, it } from 'vite-plus/test';

import {
  REVIEW_DECLINED,
  REVIEW_WITH_NO_SUPPRESSED,
  REVIEW_WITH_ONE_SUPPRESSED,
  REVIEW_WITH_THREE_SUPPRESSED,
} from './copilot-suppressed-fixtures.mjs';
import {
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
    const lines = suppressedLines(collectSuppressedComments([injected]));
    expect(lines.some((line) => line.trim().startsWith('::'))).toBe(false);
    expect(lines.join('\n')).toContain('::error::planted');
  });

  it('reports a problem before it reports a count', () => {
    const lines = suppressedLines(UNREADABLE, { pr: 1 });
    expect(lines[0]).toContain('could NOT be read');
    expect(lines[1]).toContain('no known Copilot review shape');
  });
});

describe('the job summary', () => {
  it('renders one checkbox per finding, under its own heading', () => {
    const markdown = suppressedMarkdown(FOUND, { pr: 740 });
    expect(markdown).toContain('### Copilot suppressed comments');
    expect(markdown.match(/^- \[ ] /gm)).toHaveLength(FOUND.findings.length);
    expect(markdown).toContain('docs/tooling/copilot-review-gate.md');
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
  it('keeps the verdict as the last line the gate emits', () => {
    // The reconcile sweep reads a gate's LAST line as its outcome for that pull
    // request. Moving the suppressed-comment report below the verdict would put
    // a finding where the sweep expects a state, and nothing else would notice.
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

  it('truncates the whole string rather than dropping the note', () => {
    // Dropping it would be the silent zero again, in the one place a merger
    // actually looks.
    const long = 'x'.repeat(DESCRIPTION_LIMIT);
    const described = withStatusNote(long, suppressedStatusNote(FOUND));
    expect(described.length).toBe(DESCRIPTION_LIMIT);
    expect(described.endsWith('…')).toBe(true);
  });
});
