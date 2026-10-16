import type { EnvelopeUpcasters } from './envelope.types.ts';

export const ENVELOPE_SCHEMA_VERSION = 1;

export const SUITES = [
  'rules-consistency',
  'skills',
  'verifier-fixtures',
  'verifier-tooled',
  'skill-quality',
] as const;

export const OUTCOMES = [
  'pass',
  'fail',
  'error',
  'timeout',
  'skipped',
] as const;

export const DETAIL_SCHEMA_BY_SUITE = {
  'rules-consistency': 'rules/1',
  'skill-quality': 'quality/1',
  skills: 'skills/1',
  'verifier-fixtures': 'verifier/1',
  'verifier-tooled': 'verifier-tooled/1',
} as const satisfies Record<(typeof SUITES)[number], string>;

export const ENVELOPE_UPCASTERS: EnvelopeUpcasters = {};
