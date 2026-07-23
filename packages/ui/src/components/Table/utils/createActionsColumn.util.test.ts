import { describe, expect, it } from 'vite-plus/test';

import { createActionsColumn } from './createActionsColumn.util';

type Row = {
  id: number;
  name: string;
};

describe('createActionsColumn', () => {
  it('builds the default actions column shape when no overrides are passed', () => {
    const result = createActionsColumn<Row>();

    expect(result).toStrictEqual({
      isFilterable: false,
      isHeaderHidden: true,
      isResizable: false,
      isSortable: false,
      isStatic: true,
      key: 'actions',
      label: 'Actions',
      maxWidth: 32,
      minWidth: 32,
    });
  });

  it('merges consumer overrides onto the defaults', () => {
    const render = (row: Row) => row.name;

    const result = createActionsColumn<Row>({ label: 'Row Actions', render });

    expect(result.label).toBe('Row Actions');
    expect(result.render).toBe(render);
    expect(result.isStatic).toBe(true);
  });

  it('always forces key to "actions" even if overrides include a different key', () => {
    const result = createActionsColumn<Row>({ key: 'id' });

    expect(result.key).toBe('actions');
  });
});
