import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { schemaSamples } from './schemaSamples.util.ts';

const MARKER = 'zz-marker';

const strings = z.array(z.string());
const optionalNote = z.string().nullable().optional();
const shortHash = z.string().regex(/^[0-9a-f]{12}$/u);
const dimension = z.object({ feedback: z.string() });
const outcomes = z.enum(['pass', 'fail']);
const textVariant = z.object({ schema: z.literal('a'), text: z.string() });
const bareVariant = z.object({ schema: z.literal('b') });

const MARKED = z.object({
  argv: strings,
  node: z.string(),
  note: optionalNote,
});

const CLOSED = z.object({
  at: z.iso.datetime(),
  hash: shortHash,
  kind: z.enum(['a', 'b']),
  ok: z.boolean(),
  schema: z.literal('x/1'),
  score: z.number(),
});

const LIST_OF_OBJECTS = z.object({ dimensions: z.array(dimension) });

const BY_OUTCOME = z.record(outcomes, z.int());

const VARIANTS = z.discriminatedUnion('schema', [textVariant, bareVariant]);

const UNDECIDED = z.object({ blob: z.unknown() });

describe('schemaSamples', () => {
  it('writes the marker only into the seed paths', () => {
    expect(
      schemaSamples({
        marker: MARKER,
        schema: MARKED,
        seedPaths: ['argv', 'note'],
      }),
    ).toEqual([{ argv: [MARKER], node: 'public-sample', note: MARKER }]);
  });

  it('fills a closed field with a value its format accepts', () => {
    expect(
      schemaSamples({ marker: MARKER, schema: CLOSED, seedPaths: [] }),
    ).toEqual([
      {
        at: '2026-01-01T00:00:00.000Z',
        hash: '000000000000',
        kind: 'a',
        ok: true,
        schema: 'x/1',
        score: 1,
      },
    ]);
  });

  it('marks a field inside a list of objects', () => {
    expect(
      schemaSamples({
        marker: MARKER,
        schema: LIST_OF_OBJECTS,
        seedPaths: ['dimensions[].feedback'],
      }),
    ).toEqual([{ dimensions: [{ feedback: MARKER }] }]);
  });

  it('gives every key of an enum-keyed record a value', () => {
    expect(
      schemaSamples({ marker: MARKER, schema: BY_OUTCOME, seedPaths: [] }),
    ).toEqual([{ fail: 1, pass: 1 }]);
  });

  it('samples every variant of a union', () => {
    expect(
      schemaSamples({ marker: MARKER, schema: VARIANTS, seedPaths: ['text'] }),
    ).toEqual([{ schema: 'a', text: MARKER }, { schema: 'b' }]);
  });

  it('refuses a type it cannot sample', () => {
    expect(() =>
      schemaSamples({ marker: MARKER, schema: UNDECIDED, seedPaths: [] }),
    ).toThrow('cannot sample blob (unknown)');
  });
});
