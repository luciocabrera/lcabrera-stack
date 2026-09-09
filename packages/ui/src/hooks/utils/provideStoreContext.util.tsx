/**
 * React context is not generic at the module level. Store providers pass a
 * TData snapshot through this wrapper so they do not cast `as *ContextValue`.
 */

import type { Context, ReactNode } from 'react';

type ProvideStoreContextProps<TErased, TValue> = {
  readonly children: ReactNode;
  readonly context: Context<TErased>;
  readonly value: TValue;
};

export const ProvideStoreContext = <TErased, TValue>({
  children,
  context: StoreContext,
  value,
}: ProvideStoreContextProps<TErased, TValue>) => (
  <StoreContext value={value as unknown as TErased}>{children}</StoreContext>
);
