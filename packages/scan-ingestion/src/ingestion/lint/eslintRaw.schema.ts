import { z } from 'zod';

/**
 * Loose parse of eslint.raw.json (`{ kind: 'eslint', results: [...] }`,
 * results = the standard ESLint JSON formatter array). Every field is
 * defaulted so a future eslint version's shape drift degrades to partial
 * extraction instead of throwing — detail extraction must never flip an
 * already-succeeded scan to failed (ADR-019).
 */
const eslintSuppressionSchema = z.object({
  justification: z.string().nullish(),
  kind: z.string().nullish(),
});

const eslintSuggestionSchema = z.object({
  desc: z.string().nullish(),
});

const eslintMessageSchema = z.object({
  column: z.number().nullish(),
  endColumn: z.number().nullish(),
  endLine: z.number().nullish(),
  fix: z.unknown().nullish(),
  line: z.number().nullish(),
  message: z.string().default('Lint rule violation.'),
  messageId: z.string().nullish(),
  ruleId: z.string().nullish(),
  severity: z.number().default(1),
  suggestions: z.array(eslintSuggestionSchema).nullish(),
  suppressions: z.array(eslintSuppressionSchema).nullish(),
});

const eslintFileResultSchema = z.object({
  errorCount: z.number().default(0),
  fatalErrorCount: z.number().default(0),
  filePath: z.string().default(''),
  fixableErrorCount: z.number().default(0),
  fixableWarningCount: z.number().default(0),
  messages: z.array(eslintMessageSchema).default([]),
  suppressedMessages: z.array(eslintMessageSchema).default([]),
  warningCount: z.number().default(0),
});

export const eslintRawSchema = z.object({
  kind: z.string().nullish(),
  results: z.array(eslintFileResultSchema).default([]),
});

export type EslintMessage = z.infer<typeof eslintMessageSchema>;
export type EslintRaw = z.infer<typeof eslintRawSchema>;
