import { describe, expect, test } from 'vite-plus/test';

import {
  classifyMaterialisation,
  emptyManifest,
  hashContent,
  isRecorded,
  isReported,
  isWritten,
  nextManifest,
  parseManifest,
  serialiseManifest,
} from './manifest.mjs';

const A = hashContent('a');
const B = hashContent('b');

describe('classifyMaterialisation', () => {
  test('writes a file this kit has never written and the tree does not have', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: undefined,
        recordedHash: undefined,
      }),
    ).toBe('added');
  });

  test('refuses to adopt an unmanaged file already sitting at that path', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: B,
        recordedHash: undefined,
      }),
    ).toBe('conflict');
  });

  test('treats an identical unmanaged file as already current', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: A,
        recordedHash: undefined,
      }),
    ).toBe('current');
  });

  test('keeps a locally modified file rather than overwriting the edit', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: B,
        recordedHash: A,
      }),
    ).toBe('modified');
  });

  test('updates an untouched file when upstream has moved on', () => {
    expect(
      classifyMaterialisation({
        incomingHash: B,
        onDiskHash: A,
        recordedHash: A,
      }),
    ).toBe('updated');
  });

  test('is a no-op when nothing has moved', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: A,
        recordedHash: A,
      }),
    ).toBe('current');
  });

  test('restores a managed file the consumer deleted', () => {
    expect(
      classifyMaterialisation({
        incomingHash: A,
        onDiskHash: undefined,
        recordedHash: A,
      }),
    ).toBe('restored');
  });
});

describe('isWritten / isReported', () => {
  test('only the three write states write', () => {
    expect(['added', 'restored', 'updated'].every(isWritten)).toBe(true);
    expect(['conflict', 'current', 'modified'].some(isWritten)).toBe(false);
  });

  test('a surviving edit and a refused adoption are both reported', () => {
    expect(['conflict', 'modified'].every(isReported)).toBe(true);
    expect(isReported('current')).toBe(false);
  });

  test('an already-identical file is recorded although nothing is written', () => {
    expect(isRecorded('current')).toBe(true);
    expect(isWritten('current')).toBe(false);
  });

  test('an edit and a refused adoption are never recorded', () => {
    expect(['conflict', 'modified'].some(isRecorded)).toBe(false);
  });

  test('a refusal is reported, never written and never recorded', () => {
    for (const state of ['unmet', 'unresolved']) {
      expect(isReported(state)).toBe(true);
      expect(isWritten(state)).toBe(false);
      expect(isRecorded(state)).toBe(false);
    }
  });
});

describe('parseManifest', () => {
  test('reads a manifest this version wrote', () => {
    const raw = serialiseManifest({
      files: { 'a.md': A },
      packageVersion: '1.0.0',
      version: 1,
    });
    expect(parseManifest(raw, '1.0.0').files).toEqual({ 'a.md': A });
  });

  test('drops an entry whose hash is not a hash, rather than trusting it', () => {
    const raw = JSON.stringify({
      files: { 'bad.md': null, 'good.md': A },
      packageVersion: '1.0.0',
      version: 1,
    });
    expect(parseManifest(raw, '1.0.0').files).toEqual({ 'good.md': A });
  });

  test('falls back to the running version when the recorded one is not a string', () => {
    const raw = JSON.stringify({ files: {}, packageVersion: 7, version: 1 });
    expect(parseManifest(raw, '1.0.0').packageVersion).toBe('1.0.0');
  });

  test('treats malformed, absent and future-versioned records as no record', () => {
    expect(parseManifest('{ not json', '1.0.0')).toEqual(
      emptyManifest('1.0.0'),
    );
    expect(parseManifest('', '1.0.0')).toEqual(emptyManifest('1.0.0'));
    expect(
      parseManifest(
        JSON.stringify({ files: { 'a.md': A }, version: 99 }),
        '1.0.0',
      ),
    ).toEqual(emptyManifest('1.0.0'));
  });
});

describe('nextManifest', () => {
  test('records what was written and leaves an untouched entry as it was', () => {
    const previous = {
      files: { 'kept.md': A, 'skipped.md': A },
      packageVersion: '1.0.0',
      version: 1,
    };
    const entries = [
      { incomingHash: B, path: 'kept.md', state: 'updated' },
      { incomingHash: B, path: 'skipped.md', state: 'modified' },
      { incomingHash: A, path: 'new.md', state: 'added' },
      { incomingHash: A, path: 'adopted.md', state: 'current' },
    ];
    expect(nextManifest({ entries, previous, version: '2.0.0' })).toEqual({
      files: { 'adopted.md': A, 'kept.md': B, 'new.md': A, 'skipped.md': A },
      packageVersion: '2.0.0',
      version: 1,
    });
  });
});

describe('serialiseManifest', () => {
  test('orders paths so a re-sync produces no incidental diff', () => {
    const raw = serialiseManifest({
      files: { 'b.md': A, 'a.md': B },
      packageVersion: '1.0.0',
      version: 1,
    });
    expect(raw.indexOf('a.md')).toBeLessThan(raw.indexOf('b.md'));
    expect(raw.endsWith('\n')).toBe(true);
  });
});
