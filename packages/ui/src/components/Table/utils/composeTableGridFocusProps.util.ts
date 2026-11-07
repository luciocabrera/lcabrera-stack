import type { ComponentPropsWithRef, FocusEvent, KeyboardEvent } from 'react';

import { composeEventHandlers } from './composeEventHandlers.util';

type ComposeTableGridFocusPropsArgs = {
  readonly grid: {
    readonly onBlur: (event: FocusEvent<HTMLTableElement>) => void;
    readonly onFocus: (event: FocusEvent<HTMLTableElement>) => void;
    readonly onKeyDown: (event: KeyboardEvent<HTMLTableElement>) => void;
    readonly tabIndex: number;
  };
  readonly tableProps: Pick<
    ComponentPropsWithRef<'table'>,
    'onBlur' | 'onFocus' | 'onKeyDown'
  >;
};

export const composeTableGridFocusProps = ({
  grid,
  tableProps,
}: ComposeTableGridFocusPropsArgs) => ({
  onBlur: composeEventHandlers({
    consumer: tableProps.onBlur,
    grid: grid.onBlur,
  }),
  onFocus: composeEventHandlers({
    consumer: tableProps.onFocus,
    grid: grid.onFocus,
  }),
  onKeyDown: composeEventHandlers({
    consumer: tableProps.onKeyDown,
    grid: grid.onKeyDown,
  }),
  tabIndex: grid.tabIndex,
});
