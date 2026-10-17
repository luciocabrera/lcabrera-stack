import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { memoryFileSystem } from './memoryFileSystem.util.ts';

export const envelopeFileSystem = (envelopes: readonly RunEnvelope[]) =>
  memoryFileSystem(
    Object.fromEntries(
      envelopes.map((envelope) => [
        `/results/${envelope.run.suite}/${envelope.run.run_id}.json`,
        JSON.stringify(envelope),
      ]),
    ),
  );
