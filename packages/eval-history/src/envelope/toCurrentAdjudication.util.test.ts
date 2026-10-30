import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { isPlainObject } from '../hashing/isPlainObject.util.ts';
import { ADJUDICATION_SCHEMA_VERSION } from './envelope.constants.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';
import { toCurrentAdjudication } from './toCurrentAdjudication.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('fixtures', import.meta.url)),
});
const read = fixtures.get('adjudication.json');
const fixture = isPlainObject(read) ? read : {};
const caseFields = isPlainObject(fixture.case) ? fixture.case : {};
const { case_id: caseId, ...caseWithoutId } = caseFields;
const previous = ADJUDICATION_SCHEMA_VERSION - 1;

const previousEnvelope = {
  ...fixture,
  case: { ...caseWithoutId, id: caseId },
  schema_version: previous,
};

const renameCaseId = (envelope: Readonly<Record<string, unknown>>) => {
  const { id, ...rest } = isPlainObject(envelope.case) ? envelope.case : {};

  return {
    ...envelope,
    case: { ...rest, case_id: id },
    schema_version: ADJUDICATION_SCHEMA_VERSION,
  };
};

const upcasters = { [previous]: renameCaseId };

describe('toCurrentAdjudication', () => {
  it('parses a current envelope', () => {
    const result = toCurrentAdjudication({ input: fixture });

    expect(result.ok && result.envelope.case.case_id).toBe(caseId);
  });

  it('accepts an envelope one version behind through its upcaster', () => {
    const result = toCurrentAdjudication({
      input: previousEnvelope,
      upcasters,
    });

    expect(result.ok && result.envelope.case.case_id).toBe(caseId);
    expect(result.ok && result.envelope.schema_version).toBe(
      ADJUDICATION_SCHEMA_VERSION,
    );
  });

  it('rejects the previous version when no upcaster is registered', () => {
    expect(toCurrentAdjudication({ input: previousEnvelope })).toEqual({
      ok: false,
      problems: [
        `schema_version ${String(previous)} is not supported: this ingester reads version ${String(ADJUDICATION_SCHEMA_VERSION)} (ADR-131)`,
      ],
    });
  });

  it('rejects an envelope two versions behind, naming its version', () => {
    expect(
      toCurrentAdjudication({
        input: { ...previousEnvelope, schema_version: previous - 1 },
        upcasters,
      }),
    ).toEqual({
      ok: false,
      problems: [
        `schema_version ${String(previous - 1)} is not supported: this ingester reads version ${String(ADJUDICATION_SCHEMA_VERSION)} or ${String(previous)} (ADR-131)`,
      ],
    });
  });

  it('names each field that fails the schema', () => {
    expect(
      toCurrentAdjudication({ input: { ...fixture, case: caseWithoutId } }),
    ).toEqual({
      ok: false,
      problems: [
        'case.case_id: Invalid input: expected string, received undefined',
      ],
    });
  });
});
