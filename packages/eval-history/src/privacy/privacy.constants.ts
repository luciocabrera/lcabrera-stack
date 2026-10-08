export const OPERATOR_CHARACTERS = '+-*/<>=~!@#%^&|?';

export const IDENTIFIER_START = /[a-z_]/iu;

export const IDENTIFIER_PART = /[\w$]/u;

export const DIGIT = /\d/u;

export const WHITESPACE = /\s/u;

export const ARRAY_ELEMENTS_FUNCTION = 'jsonb_array_elements';

export const FIELD_OPERATORS = ['->', '->>'] as const;

export const CLAUSE_KEYWORDS = new Set([
  'cross',
  'except',
  'fetch',
  'for',
  'full',
  'group',
  'having',
  'inner',
  'intersect',
  'join',
  'lateral',
  'left',
  'limit',
  'natural',
  'offset',
  'on',
  'order',
  'right',
  'tablesample',
  'union',
  'using',
  'where',
  'window',
]);
