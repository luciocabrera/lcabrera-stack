import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { writeStateSlice } from './writeStateSlice.util.ts';

vi.mock('@/utils/storage', () => ({
  writeToCookie: vi.fn(),
  writeToLocalStorage: vi.fn(),
}));

import { writeToCookie, writeToLocalStorage } from '@/utils/storage';

describe('writeStateSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls writeToCookie when storageType is cookie', () => {
    writeStateSlice({
      persistenceKey: 'myTable',
      slice: 'sorting',
      storageType: 'cookie',
      value: [],
    });
    expect(vi.mocked(writeToCookie)).toHaveBeenCalledOnce();
    expect(vi.mocked(writeToLocalStorage)).not.toHaveBeenCalled();
  });

  it('calls writeToLocalStorage when storageType is localStorage', () => {
    writeStateSlice({
      persistenceKey: 'myTable',
      slice: 'sorting',
      storageType: 'localStorage',
      value: [],
    });
    expect(vi.mocked(writeToLocalStorage)).toHaveBeenCalledOnce();
    expect(vi.mocked(writeToCookie)).not.toHaveBeenCalled();
  });

  it('passes headers to writeToCookie', () => {
    const headers = new Headers();
    writeStateSlice({
      headers,
      persistenceKey: 'myTable',
      slice: 'sorting',
      storageType: 'cookie',
      value: [],
    });
    expect(vi.mocked(writeToCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ headers }),
    );
  });
});
