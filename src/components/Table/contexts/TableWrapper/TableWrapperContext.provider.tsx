import { useRef } from 'react';

import type { TableWrapperProviderProps } from './TableWrapperContext.types';

import { TableWrapperContext } from './TableWrapperContext.context';

export const TableWrapperProvider = ({
  children,
}: TableWrapperProviderProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  return (
    <TableWrapperContext value={{ wrapperRef }}>{children}</TableWrapperContext>
  );
};
