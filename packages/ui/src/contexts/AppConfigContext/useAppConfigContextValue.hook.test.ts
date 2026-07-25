// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { useAppConfigContextValue } from './useAppConfigContextValue.hook';

describe('useAppConfigContextValue', () => {
  it('throws when used outside the AppConfigProvider', () => {
    expect(() => renderHook(() => useAppConfigContextValue())).toThrow(
      'useAppConfigContextValue must be used within AppConfigProvider',
    );
  });
});
