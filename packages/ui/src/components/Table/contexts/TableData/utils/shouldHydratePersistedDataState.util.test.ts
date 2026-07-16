import { describe, expect, it } from 'vitest';

import { shouldHydratePersistedDataState } from './shouldHydratePersistedDataState.util';

type TestRow = {
  readonly id: number;
};

describe('shouldHydratePersistedDataState', () => {
  it('returns false when persisted state is missing', () => {
    expect(
      shouldHydratePersistedDataState<TestRow>({
        initialDataState: {
          data: [{ id: 1 }],
          totalRows: 10,
        },
      }),
    ).toBe(false);
  });

  it('returns false when initial query has no rows', () => {
    expect(
      shouldHydratePersistedDataState<TestRow>({
        initialDataState: {
          data: [],
          totalRows: 0,
        },
        persistedDataState: {
          data: [{ id: 1 }, { id: 2 }],
          totalRows: 2,
        },
      }),
    ).toBe(false);
  });

  it('returns false when totals differ between current and persisted state', () => {
    expect(
      shouldHydratePersistedDataState<TestRow>({
        initialDataState: {
          data: [{ id: 1 }],
          totalRows: 3,
        },
        persistedDataState: {
          data: [{ id: 1 }, { id: 2 }],
          totalRows: 2,
        },
      }),
    ).toBe(false);
  });

  it('returns false when persisted rows do not match current page prefix', () => {
    expect(
      shouldHydratePersistedDataState<TestRow>({
        initialDataState: {
          data: [{ id: 3 }, { id: 4 }],
          totalRows: 4,
        },
        persistedDataState: {
          data: [{ id: 1 }, { id: 2 }, { id: 5 }, { id: 6 }],
          totalRows: 4,
        },
      }),
    ).toBe(false);
  });

  it('returns true when persisted rows extend the same query snapshot', () => {
    expect(
      shouldHydratePersistedDataState<TestRow>({
        initialDataState: {
          data: [{ id: 1 }, { id: 2 }],
          totalRows: 4,
        },
        persistedDataState: {
          data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
          totalRows: 4,
        },
      }),
    ).toBe(true);
  });
});
