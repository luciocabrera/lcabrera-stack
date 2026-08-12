import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

type Row = { name: string };

describe('resolveColumnCapabilities', () => {
  it('materializes the defaults for a column that declares no flag', () => {
    expect(resolveColumnCapabilities({})).toStrictEqual({
      isFilterable: true,
      isGroupable: true,
      isResizable: true,
      isSortable: true,
      isStatic: false,
    });
  });

  it('resolves an absent column to the same defaults', () => {
    expect(resolveColumnCapabilities(undefined)).toStrictEqual(
      resolveColumnCapabilities({}),
    );
  });

  it('honours every explicitly declared flag', () => {
    expect(
      resolveColumnCapabilities({
        isFilterable: false,
        isGroupable: false,
        isResizable: false,
        isSortable: false,
        isStatic: true,
      }),
    ).toStrictEqual({
      isFilterable: false,
      isGroupable: false,
      isResizable: false,
      isSortable: false,
      isStatic: true,
    });
  });

  it('treats an explicit true the same as an omitted flag', () => {
    expect(
      resolveColumnCapabilities({
        isFilterable: true,
        isGroupable: true,
        isResizable: true,
        isSortable: true,
      }),
    ).toStrictEqual(resolveColumnCapabilities({}));
  });

  it('locks resizing on a static column even when isResizable is true', () => {
    expect(
      resolveColumnCapabilities({ isResizable: true, isStatic: true })
        .isResizable,
    ).toBe(false);
  });

  it('leaves sorting, filtering and grouping available on a static column', () => {
    expect(resolveColumnCapabilities({ isStatic: true })).toStrictEqual({
      isFilterable: true,
      isGroupable: true,
      isResizable: false,
      isSortable: true,
      isStatic: true,
    });
  });

  it('refuses grouping only when the column declares isGroupable: false', () => {
    expect(resolveColumnCapabilities({ isGroupable: false }).isGroupable).toBe(
      false,
    );
    expect(resolveColumnCapabilities({ isStatic: true }).isGroupable).toBe(
      true,
    );
  });

  it('accepts a TableColumn and ignores its non-capability members', () => {
    const column: TableColumn<Row> = {
      dataType: 'string',
      key: 'name',
      label: 'Name',
    };

    expect(resolveColumnCapabilities(column)).toStrictEqual(
      resolveColumnCapabilities({}),
    );
  });
});
