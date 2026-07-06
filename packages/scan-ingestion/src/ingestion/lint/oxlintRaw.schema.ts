import { z } from 'zod';

/**
 * Loose parse of oxlint.raw.json (`{ kind: 'oxlint', diagnostics: [...],
 * number_of_files, number_of_rules }` — oxc's own JSON output plus the
 * kind discriminator). Defaulted throughout so version drift degrades to
 * partial extraction instead of throwing (ADR-019).
 */
const oxlintSpanSchema = z.object({
  column: z.number().nullish(),
  line: z.number().nullish(),
});

const oxlintLabelSchema = z.object({
  span: oxlintSpanSchema.nullish(),
});

export const oxlintDiagnosticSchema = z.object({
  code: z.string().nullish(),
  filename: z.string().default(''),
  help: z.string().nullish(),
  labels: z.array(oxlintLabelSchema).nullish(),
  message: z.string().default('Lint rule violation.'),
  severity: z.string().default('warning'),
  url: z.string().nullish(),
});

export const oxlintRawSchema = z.object({
  diagnostics: z.array(oxlintDiagnosticSchema).default([]),
  kind: z.string().nullish(),
  number_of_files: z.number().default(0),
  number_of_rules: z.number().default(0),
});

export type OxlintDiagnostic = z.infer<typeof oxlintDiagnosticSchema>;
export type OxlintRaw = z.infer<typeof oxlintRawSchema>;
