import { expect, it } from 'vite-plus/test';

import { toRefusedTablePage } from './to-refused-table-page.util.ts';

it('carries the refusal as an error beside an empty, final page', () => {
  expect(toRefusedTablePage('No group named.')).toStrictEqual({
    data: [],
    error: { kind: 'unexpected', message: 'No group named.' },
    hasMore: false,
    total: 0,
  });
});
