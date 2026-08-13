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

  it('does not blame the widest key when a key combination is what was refused', () => {
    // The trap this closes. `estimate-too-large` names the **widest** key,
    // because that is the one worth dropping — not the one just picked. So a
    // user who adds a fourth column would read "Grouping by Delivery Date was
    // refused" about a column that was already applied and fine on its own. The
    // endpoint's sentence still names it, in the role it actually plays.
    const notice = toTableEmptyStateNotice({
      columnName: 'Delivery Date',
      error: {
        column: 'delivery_date',
        estimatedRows: 73_600,
        kind: 'grouping-refused',
        message:
          'This grouping is estimated to return 73600 rows, past the 50000 ceiling. Column "delivery_date" is the widest group key at 736 distinct values — drop it or filter it down.',
        reason: 'estimate-too-large',
      },
      titleSingular: 'Order',
    });

    expect(notice.title).toBe('This grouping was refused');
    expect(notice.message).toContain('delivery_date');
    expect(notice.message).toContain('drop it or filter it down');
  });

  it('does not call an illegal aggregate a refused group key', () => {
    // `aggregate-not-legal` names an *aggregated* column, which need not be a
    // group key at all — so the heading may not claim it was one.
    const notice = toTableEmptyStateNotice({
      columnName: 'Order Notes',
      error: {
        column: 'order_notes',
        kind: 'grouping-refused',
        message:
          '"sum" is not legal for column "order_notes" (text); the catalogue offers count, countDistinct.',
        reason: 'aggregate-not-legal',
      },
      titleSingular: 'Order',
    });

    expect(notice.title).toBe('This grouping was refused');
    expect(notice.message).toContain('order_notes');
  });

  it('still says a grouping was refused when the refusal names no single column', () => {
    // `too-many-keys` is about the request as a whole, so there is no column to
    // name and the heading must not pretend there is.
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
