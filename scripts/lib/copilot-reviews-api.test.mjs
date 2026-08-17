import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { fetchPullRequestReviews } from './copilot-reviews-api.mjs';
import { runGh } from './gh-exec.mjs';

// What this pins is the ARGV, and the limit is worth stating plainly because the
// subject suggests more: `gh` is mocked, so gh's own pagination never runs here
// and nothing below shows that every page is really fetched. What it does show
// is that the three things whose loss is silent are still asked for — page one
// alone reports a stale review and an empty suppressed block, and both read as
// answers — and that what is parsed is the shape `--slurp` returns.
//
// Nothing pinned even that while this was a private function inside one script.
// It is now the single client two readers share.
vi.mock('./gh-exec.mjs', () => ({ runGh: vi.fn() }));

const REVIEW = { id: 1, state: 'COMMENTED', user: { login: 'copilot' } };

const argv = () => runGh.mock.calls[0][0];

beforeEach(() => {
  vi.mocked(runGh).mockReset();
  vi.mocked(runGh).mockReturnValue(JSON.stringify([[REVIEW]]));
});

describe('fetching a pull request reviews', () => {
  it('asks gh for all pages, and reads the shape --slurp returns', () => {
    // Without `--slurp` gh documents each page as a separate JSON document,
    // which `JSON.parse` cannot read; without `--paginate` there is only one.
    expect(fetchPullRequestReviews('luciocabrera/repo', 740)).toEqual([REVIEW]);
    expect(argv()).toContain('--paginate');
    expect(argv()).toContain('--slurp');
  });

  it('puts per_page in the path, never in a field argument', () => {
    // Any `-F`/`-f` makes `gh api` issue a POST, and POST on this endpoint OPENS
    // a review instead of listing them — a read that silently writes.
    fetchPullRequestReviews('luciocabrera/repo', 740);
    expect(argv()).toEqual([
      'api',
      '--paginate',
      '--slurp',
      'repos/luciocabrera/repo/pulls/740/reviews?per_page=100',
    ]);
  });

  it('joins the pages instead of returning gh outer array', () => {
    vi.mocked(runGh).mockReturnValue(
      JSON.stringify([[REVIEW], [{ ...REVIEW, id: 2 }]]),
    );
    expect(fetchPullRequestReviews('luciocabrera/repo', 740)).toHaveLength(2);
  });
});
