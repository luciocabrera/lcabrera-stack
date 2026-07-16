// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { createElement, createRef } from 'react';
import { describe, expect, it } from 'vitest';

import type { TableWrapperContextValue } from './TableWrapperContext.types';

import { TableWrapperContext } from './TableWrapperContext.context';
import { useTableContainerRef } from './useTableContainerRef.hook';
import { useTableWrapperRef } from './useTableWrapperRef.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const createWrapper = (value: TableWrapperContextValue) => {
  return function Wrapper({ children }: WrapperProps) {
    return createElement(TableWrapperContext, { value }, children);
  };
};

describe('TableWrapper hooks', () => {
  it('returns the wrapper and container refs from context', () => {
    const contextValue: TableWrapperContextValue = {
      containerRef: createRef<HTMLDivElement>(),
      wrapperRef: createRef<HTMLDivElement>(),
    };

    const wrapperRefResult = renderHook(() => useTableWrapperRef(), {
      wrapper: createWrapper(contextValue),
    });
    const containerRefResult = renderHook(() => useTableContainerRef(), {
      wrapper: createWrapper(contextValue),
    });

    expect(wrapperRefResult.result.current).toBe(contextValue.wrapperRef);
    expect(containerRefResult.result.current).toBe(contextValue.containerRef);
  });

  it('throws when used outside the TableWrapper provider', () => {
    expect(() => renderHook(() => useTableWrapperRef())).toThrow(
      'useTableWrapperRef must be used within TableWrapperProvider',
    );
    expect(() => renderHook(() => useTableContainerRef())).toThrow(
      'useTableContainerRef must be used within TableWrapperProvider',
    );
  });
});
