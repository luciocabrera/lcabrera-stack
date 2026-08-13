import { describe, expect, it } from 'vite-plus/test';

import { toTableEmptyStateNotice } from './toTableEmptyStateNotice.util';

describe('toTableEmptyStateNotice', () => {
  it('shows the table title and the filters nudge when nothing was refused', () => {
    const notice = toTableEmptyStateNotice({
      columnName: undefined,
      error: undefined,
      titleSingular: 'Order',
    });

    expect(notice.title).toBe('Order');
    expect(notice.message).toMatch(/No records match the current view/);
  });

  it('names the refused column in the heading and keeps the endpoint sentence', () => {
    const notice = toTableEmptyStateNotice({
      columnName: 'Total Amount',
      error: {
        column: 'total_amount',
        kind: 'grouping-refused',
        message:
          'Column "total_amount" is not a legal group key: too-many-distinct.',
        reason: 'column-not-groupable',
      },
      titleSingular: 'Order',
    });

    // The heading is the label the user picked the column by; the sentence is
    // the endpoint's, which is the only thing that knows *why*.
    expect(notice.title).toBe('Grouping by Total Amount was refused');
    expect(notice.message).toBe(
      'Column "total_amount" is not a legal group key: too-many-distinct.',
    );
  });

  it('still says a grouping was refused when the refusal names no single column', () => {
    // `too-many-keys` and `estimate-too-large` are about the key combination,
    // so there is no column to name and the heading must not pretend there is.
    const notice = toTableEmptyStateNotice({
      columnName: undefined,
      error: {
        kind: 'grouping-refused',
        message: 'A grouped query takes at most 4 group keys; got 5.',
        reason: 'too-many-keys',
      },
      titleSingular: 'Order',
    });

    expect(notice.title).toBe('This grouping was refused');
    expect(notice.message).toBe(
      'A grouped query takes at most 4 group keys; got 5.',
    );
  });

  it('tells a cancelled query apart from a failed one', () => {
    const canceled = toTableEmptyStateNotice({
      columnName: undefined,
      error: { kind: 'db-canceled', message: 'The query was cancelled.' },
      titleSingular: 'Order',
    });
    const failed = toTableEmptyStateNotice({
      columnName: undefined,
      error: { kind: 'db-failed', message: 'The database rejected the read.' },
      titleSingular: 'Order',
    });

    expect(canceled.title).toBe('This query took too long');
    expect(failed.title).toBe('This table could not be loaded');
    expect(canceled.message).toBe('The query was cancelled.');
    expect(failed.message).toBe('The database rejected the read.');
  });

  it('never falls back to the no-data message once an error arrived', () => {
    // The failure this closes: an unrecognised arm rendering "adjust your
    // filters" over a refusal, which is the silent empty table again.
    const notice = toTableEmptyStateNotice({
      columnName: undefined,
      error: {
        kind: 'unexpected',
        message: 'The request could not be completed.',
      },
      titleSingular: 'Order',
    });

    expect(notice.message).not.toMatch(/No records match the current view/);
    expect(notice.message).toBe('The request could not be completed.');
  });
});
