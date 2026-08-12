// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';
import { TableDataProvider } from '#ui/components/Table/contexts/TableData/TableDataContext.provider';

import { useGetTableGroupingKeys } from './grouping/selectors';
import { TableConfigProvider } from './TableConfigContext.provider';
import { useTableConfigContextValue } from './useTableConfigContextValue.hook';

type HarnessProps = {
  readonly groupingKeys?: readonly string[];
  /**
   * Stands in for a navigation. It keys **only** the data provider, which is
   * what React Router does in practice: `TableConfigProvider` sits outside the
   * Suspense boundary and stays mounted, while `TableDataProvider` sits inside
   * it and is re-created from each navigation's resolved promise.
   */
  readonly revalidation: number;
};

type TestRow = {
  readonly id: number;
};

const mounts = { config: 0, data: 0 };

const ConfigMountCounter = () => {
  useEffect(() => {
    mounts.config += 1;
  }, []);

  return <span data-testid='config-mount' />;
};

const DataMountCounter = () => {
  useEffect(() => {
    mounts.data += 1;
  }, []);

  return <span data-testid='data-mount' />;
};

const Probe = () => {
  const { groupingStore } = useTableConfigContextValue<TestRow>();
  const groupingKeys = useGetTableGroupingKeys();
  const data = useGetTableData<TestRow>();

  const handleRegroup = () => {
    groupingStore.set({ keys: ['priority'] });
  };

  return (
    <>
      <button onClick={handleRegroup} type='button'>
        regroup
      </button>
      <output data-testid='grouping'>{groupingKeys.join(',')}</output>
      <output data-testid='data'>{data.map((row) => row.id).join(',')}</output>
    </>
  );
};

const Harness = ({ groupingKeys, revalidation }: HarnessProps) => (
  <TableConfigProvider<TestRow>
    columnsState={{ columns: [{ key: 'id', label: 'ID' }] }}
    metaState={{ groupingKeys, persistenceKey: 'orders' }}
  >
    <ConfigMountCounter />
    <TableDataProvider<TestRow>
      dataState={{ data: [{ id: revalidation }] }}
      key={revalidation}
    >
      <DataMountCounter />
      <Probe />
    </TableDataProvider>
  </TableConfigProvider>
);

const readProbe = (testId: string) => screen.getByTestId(testId).textContent;

describe('TableConfigProvider', () => {
  beforeEach(() => {
    mounts.config = 0;
    mounts.data = 0;
  });

  afterEach(cleanup);

  it('seeds the grouping store from the keys the loader applied', () => {
    render(<Harness groupingKeys={['order_status']} revalidation={1} />);

    expect(readProbe('grouping')).toBe('order_status');
  });

  it('defaults the grouping store to ungrouped when the loader applied none', () => {
    render(<Harness revalidation={1} />);

    expect(readProbe('grouping')).toBe('');
  });

  it('keeps grouping across a data revalidation that re-creates the data context', () => {
    const { rerender } = render(
      <Harness groupingKeys={['order_status']} revalidation={1} />,
    );

    fireEvent.click(screen.getByText('regroup'));

    expect(readProbe('grouping')).toBe('priority');
    expect(readProbe('data')).toBe('1');

    rerender(<Harness groupingKeys={['order_status']} revalidation={2} />);

    // The mount counts are what make this a probe rather than an assertion that
    // nothing happened: the data half really was re-created and the config half
    // really was not, so grouping surviving is evidence about *where the store
    // lives*. On the data context the same click-then-revalidate would read
    // back the loader's `order_status`.
    expect(mounts.data).toBe(2);
    expect(mounts.config).toBe(1);
    expect(readProbe('data')).toBe('2');
    expect(readProbe('grouping')).toBe('priority');
  });
});
