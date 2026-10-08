import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { envelopeFileSystem } from './envelopeFileSystem.util.ts';

const envelope: RunEnvelope = JSON.parse(
  '{"run": {"run_id": "4e5aa14f-79b7-452d-be7c-66bdff258a25", "suite": "skills"}}',
);

describe('envelopeFileSystem', () => {
  it('files each envelope under its suite by run id', async () => {
    const fileSystem = envelopeFileSystem([envelope]);
    const [entry] = await fileSystem.readdir('/results');
    const bytes = await fileSystem.readFile(
      '/results/skills/4e5aa14f-79b7-452d-be7c-66bdff258a25.json',
    );

    expect(entry?.parentPath).toBe('/results/skills');
    expect(JSON.parse(new TextDecoder().decode(bytes))).toEqual(envelope);
  });
});
