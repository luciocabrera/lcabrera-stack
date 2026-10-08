import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { isPlainObject } from '../hashing/isPlainObject.util.ts';
import { ENVELOPE_SCHEMA_VERSION } from './envelope.constants.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';
import { toCurrentEnvelope } from './toCurrentEnvelope.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('fixtures', import.meta.url)),
});
const skills = fixtures.get('skills.json');
const fixture = isPlainObject(skills) ? skills : {};

const run = isPlainObject(fixture.run) ? fixture.run : {};
const { run_id: runId, ...runWithoutId } = run;
const previous = ENVELOPE_SCHEMA_VERSION - 1;

const previousEnvelope = {
  ...fixture,
  run: { ...runWithoutId, id: runId },
  schema_version: previous,
};

const renameRunId = (envelope: Readonly<Record<string, unknown>>) => {
  const { id, ...rest } = isPlainObject(envelope.run) ? envelope.run : {};

  return {
    ...envelope,
    run: { ...rest, run_id: id },
    schema_version: ENVELOPE_SCHEMA_VERSION,
  };
};

const upcasters = { [previous]: renameRunId };

describe('toCurrentEnvelope', () => {
  it('parses a current envelope', () => {
    const result = toCurrentEnvelope({ input: fixture });

    expect(result.ok && result.envelope.run.run_id).toBe(runId);
  });

  it('accepts an envelope one version behind through its upcaster', () => {
    const result = toCurrentEnvelope({ input: previousEnvelope, upcasters });

    expect(result.ok && result.envelope.run.run_id).toBe(runId);
    expect(result.ok && result.envelope.schema_version).toBe(
      ENVELOPE_SCHEMA_VERSION,
    );
  });

  it('rejects an envelope two versions behind, naming its version', () => {
    expect(
      toCurrentEnvelope({
        input: { ...previousEnvelope, schema_version: previous - 1 },
        upcasters,
      }),
    ).toEqual({
      ok: false,
      problems: [
        `schema_version ${String(previous - 1)} is not supported: this ingester reads version ${String(ENVELOPE_SCHEMA_VERSION)} or ${String(previous)} (ADR-131)`,
      ],
    });
  });

  it('names each field that fails the schema', () => {
    const result = toCurrentEnvelope({
      input: { ...fixture, run: runWithoutId },
    });

    expect(result.ok ? [] : result.problems).toEqual([
      'run.run_id: Invalid input: expected string, received undefined',
    ]);
  });
});
