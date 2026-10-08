import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { trialDetailSchema } from '../envelope/envelope.schema.ts';
import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { freeStringPaths } from './freeStringPaths.util.ts';

const strings = z.array(z.string());
const hash = z.string().regex(/^[0-9a-f]{64}$/u);
const dimension = z.object({ feedback: z.string(), score: z.number() });
const note = z.object({ note: z.string().optional() });

const LISTS = z.object({ argv: strings, node: z.string().nullable() });

const CLOSED = z.object({
  check: z.enum(['indexed', 'covered']),
  hash,
  matched: z.boolean(),
  not_met: z.array(z.int()),
  run_id: z.uuidv4(),
  schema: z.literal('rules/1'),
  score: z.number(),
});

const NESTED = z.object({ dimensions: z.array(dimension), nested: note });

const ENUM_KEYED = z.object({
  by_outcome: z.record(z.enum(['pass']), z.string()),
});

const TEXT_KEYED = z.object({ usage: z.record(z.string(), z.int()) });

const UNDECIDED = z.object({ blob: z.unknown() });

describe('freeStringPaths', () => {
  it('names a free string and a list of them by their field', () => {
    expect(freeStringPaths({ schema: LISTS })).toEqual(['argv', 'node']);
  });

  it('skips an enum, a literal, a number, a boolean and a closed format', () => {
    expect(freeStringPaths({ schema: CLOSED })).toEqual([]);
  });

  it('walks into a list of objects and a nested object', () => {
    expect(freeStringPaths({ schema: NESTED })).toEqual([
      'dimensions[].feedback',
      'nested.note',
    ]);
  });

  it('walks a record whose keys are closed', () => {
    expect(freeStringPaths({ schema: ENUM_KEYED })).toEqual(['by_outcome.*']);
  });

  it('refuses a record whose keys can hold text', () => {
    expect(() => freeStringPaths({ schema: TEXT_KEYED })).toThrow(
      'the keys of usage can hold free text',
    );
  });

  it('refuses a type it cannot decide', () => {
    expect(() => freeStringPaths({ schema: UNDECIDED })).toThrow(
      'cannot tell whether blob (unknown) holds free text',
    );
  });

  it('unions the paths of every detail variant', () => {
    expect(
      freeStringPaths({ schema: trialDetailSchema }).toSorted(compareCodeUnits),
    ).toEqual([
      'dimensions[].feedback',
      'dimensions[].name',
      'expected_skill',
      'findings',
      'fixture',
      'init_tools',
      'invoked',
      'judge_model',
      'problem',
      'summary',
    ]);
  });
});
