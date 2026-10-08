import { describe, expect, it } from 'vite-plus/test';

import {
  ENVELOPE_SCHEMA_VERSION,
  ENVELOPE_UPCASTERS,
} from './envelope.constants.ts';
import { upcastEnvelope } from './upcastEnvelope.util.ts';

const toTwo = (envelope: Readonly<Record<string, unknown>>) => ({
  ...envelope,
  schema_version: 2,
  upcast: true,
});

describe('upcastEnvelope', () => {
  it('passes the current version through unchanged', () => {
    const input = { schema_version: 2 };

    expect(upcastEnvelope({ current: 2, input, upcasters: {} })).toEqual({
      input,
      ok: true,
    });
  });

  it('upcasts the version one behind', () => {
    expect(
      upcastEnvelope({
        current: 2,
        input: { schema_version: 1 },
        upcasters: { 1: toTwo },
      }),
    ).toEqual({ input: { schema_version: 2, upcast: true }, ok: true });
  });

  it('rejects the version two behind, naming it and the versions it reads', () => {
    expect(
      upcastEnvelope({
        current: 2,
        input: { schema_version: 0 },
        upcasters: { 0: toTwo, 1: toTwo },
      }),
    ).toEqual({
      message:
        'schema_version 0 is not supported: this ingester reads version 2 or 1 (ADR-131)',
      ok: false,
    });
  });

  it('rejects a newer version and a missing one', () => {
    expect(
      upcastEnvelope({
        current: 1,
        input: { schema_version: 2 },
        upcasters: {},
      }),
    ).toMatchObject({
      message: expect.stringContaining('schema_version 2 is not supported'),
      ok: false,
    });
    expect(
      upcastEnvelope({ current: 1, input: [], upcasters: {} }),
    ).toMatchObject({
      message:
        'schema_version missing is not supported: this ingester reads version 1 (ADR-131)',
      ok: false,
    });
  });

  it('keeps an upcaster for exactly the version before the current one', () => {
    const previous = ENVELOPE_SCHEMA_VERSION - 1;

    expect(Object.keys(ENVELOPE_UPCASTERS).map(Number)).toEqual(
      previous >= 1 ? [previous] : [],
    );
  });
});
