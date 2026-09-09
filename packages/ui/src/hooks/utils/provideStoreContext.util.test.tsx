// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createContext, use } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ProvideStoreContext } from './provideStoreContext.util';

type ErasedValue = {
  readonly label: string;
};

type SpecificValue = {
  readonly label: 'orders';
};

const StoreContext = createContext<ErasedValue | undefined>(undefined);

const Probe = () => {
  const value = use(StoreContext);
  return <output>{value?.label}</output>;
};

describe('ProvideStoreContext', () => {
  afterEach(cleanup);

  it('provides a specific snapshot through an erased context', () => {
    const value: SpecificValue = { label: 'orders' };

    render(
      <ProvideStoreContext context={StoreContext} value={value}>
        <Probe />
      </ProvideStoreContext>,
    );

    expect(screen.getByRole('status').textContent).toBe('orders');
  });
});
