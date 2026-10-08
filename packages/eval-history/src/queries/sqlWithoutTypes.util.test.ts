import { describe, expect, it } from 'vite-plus/test';

import { sqlWithoutTypes } from './sqlWithoutTypes.util.ts';

describe('sqlWithoutTypes', () => {
  it('drops every cast, including a two-word and an array type', () => {
    expect(
      sqlWithoutTypes(
        'select a::text, $2::double precision * b, c::evals.outcome[] from t',
      ),
    ).toBe('select a , $2  * b, c  from t');
  });

  it('keeps only the body of a function definition', () => {
    expect(
      sqlWithoutTypes(
        'CREATE FUNCTION f(a text)\n RETURNS TABLE(suite text)\nAS $function$ select note.text from notes note $function$',
      ),
    ).toBe(' select note.text from notes note ');
  });

  it('leaves a bare column named like a type in place', () => {
    expect(sqlWithoutTypes('select text from evals.eval_annotation')).toBe(
      'select text from evals.eval_annotation',
    );
  });
});
