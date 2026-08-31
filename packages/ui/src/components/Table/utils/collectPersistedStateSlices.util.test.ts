import { describe, expect, it } from 'vite-plus/test';

import { collectPersistedStateSlices } from './collectPersistedStateSlices.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

const collectFrom = (raw: Readonly<Record<string, string>>) =>
  collectPersistedStateSlices({
    persistenceKey: 'table',
    readRawSlice: (sliceKey) => raw[sliceKey],
  });

const collectDecoded = (raw: Readonly<Record<string, string>>) =>
  collectPersistedStateSlices({
    persistenceKey: 'table',
    readRawSlice: (sliceKey) => raw[sliceKey],
    transformRaw: decodeURIComponent,
  });

const sliceKey = (slice: string) => `table-state-table-${slice}`;

describe('collectPersistedStateSlices', () => {
  it('reads a slice stored at the current version', () => {
    const result = collectFrom({
      [sliceKey('sorting')]: JSON.stringify({
        value: [{ desc: false, id: 'name' }],
        version: PERSISTENCE_VERSION,
      }),
    });

    expect(result.sorting).toEqual([{ desc: false, id: 'name' }]);
  });

  it('skips a slice whose stored JSON is not an object', () => {
    expect(() =>
      collectFrom({
        [sliceKey('columnOrder')]: '5',
        [sliceKey('columnSizing')]: '"text"',
        [sliceKey('sorting')]: 'null',
      }),
    ).not.toThrow();

    expect(collectFrom({ [sliceKey('sorting')]: 'null' })).toEqual({});
  });

  it('skips a slice that is not valid JSON at all', () => {
    expect(collectFrom({ [sliceKey('sorting')]: '{oops' })).toEqual({});
  });

  it('skips a slice stored at a different version', () => {
    const result = collectFrom({
      [sliceKey('sorting')]: JSON.stringify({
        value: [{ desc: true, id: 'name' }],
        version: PERSISTENCE_VERSION + 1,
      }),
    });

    expect(result.sorting).toBeUndefined();
  });

  it('skips a slice whose transformRaw throws on the raw value', () => {
    const raw = { [sliceKey('sorting')]: '%E0%A4%A' };

    expect(() => collectDecoded(raw)).not.toThrow();
    expect(collectDecoded(raw)).toEqual({});
  });

  it('rebuilds columnVisibility as a Set', () => {
    const result = collectFrom({
      [sliceKey('columnVisibility')]: JSON.stringify({
        value: ['age', 'name'],
        version: PERSISTENCE_VERSION,
      }),
    });

    expect(result.columnVisibility).toEqual(new Set(['age', 'name']));
  });
});
