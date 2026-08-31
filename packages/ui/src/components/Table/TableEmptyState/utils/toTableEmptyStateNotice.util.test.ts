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

    expect(notice.title).toBe('Grouping by Total Amount was refused');
    expect(notice.message).toBe(
      'Column "total_amount" is not a legal group key: too-many-distinct.',
    );
  });

  it('does not blame the widest key when a key combination is what was refused', () => {
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
