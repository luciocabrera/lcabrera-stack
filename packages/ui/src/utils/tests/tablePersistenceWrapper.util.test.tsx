// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { use } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';

import { TablePersistenceWrapper } from './tablePersistenceWrapper.util';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));

vi.mock('#ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => persistMock,
}));

afterEach(cleanup);

describe('TablePersistenceWrapper', () => {
  it('provides a persister for every slice the layout supplies', () => {
    const { result } = renderHook(() => use(TablePersistenceContext), {
      wrapper: TablePersistenceWrapper,
    });

    expect(result.current).toStrictEqual({
      columnSizing: persistMock,
      tableState: persistMock,
      uiFlags: persistMock,
    });
  });
});
