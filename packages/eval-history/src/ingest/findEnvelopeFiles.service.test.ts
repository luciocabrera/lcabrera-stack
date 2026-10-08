import { describe, expect, it } from 'vite-plus/test';

import { findEnvelopeFiles } from './findEnvelopeFiles.service.ts';
import { memoryFileSystem } from './memoryFileSystem.util.ts';

const RUN_ID = '4e5aa14f-79b7-452d-be7c-66bdff258a25';
const ENVELOPE = `/results/skills/${RUN_ID}.json`;

const fileSystem = memoryFileSystem({
  '/results/notes.json': '{}',
  [`/results/skills/${RUN_ID}/react-19-trigger-1.json`]: '[]',
  [ENVELOPE]: '{}',
});

describe('findEnvelopeFiles', () => {
  it('finds envelopes under a directory and skips the transcripts beside them', async () => {
    expect(
      await findEnvelopeFiles({ fileSystem, paths: ['/results'] }),
    ).toEqual({ files: [ENVELOPE], missing: [] });
  });

  it('takes a named file as it is, once', async () => {
    expect(
      await findEnvelopeFiles({
        fileSystem,
        paths: ['/results/notes.json', '/results/notes.json'],
      }),
    ).toEqual({ files: ['/results/notes.json'], missing: [] });
  });

  it('reports a path that does not exist', async () => {
    expect(await findEnvelopeFiles({ fileSystem, paths: ['/absent'] })).toEqual(
      { files: [], missing: ['/absent'] },
    );
  });
});
