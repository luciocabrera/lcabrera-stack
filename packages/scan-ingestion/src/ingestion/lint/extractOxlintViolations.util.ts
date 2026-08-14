import { makeFindingId } from '@repo/scan-report/deterministic-scan';
import { buildOxlintFixText } from '@repo/scan-report/finding-templates';
import path from 'node:path';

import type { LintViolationInput } from './lint.types.ts';
import type { OxlintRaw } from './oxlintRaw.schema.ts';

type ExtractOxlintViolationsArgs = {
  readonly raw: OxlintRaw;
  /** The scan's scope ('.' or a subfolder) — oxlint filenames are relative to the directory it ran in. */
  readonly scopeValue: string;
  /** The scan's target root (snapshot dir for UI runs, ADR-028) — file_path is stored relative to it. */
  readonly targetRootPath: string;
};

/**
 * Explodes oxlint diagnostics into cqms.lint_violations rows. oxlint has
 * no suppression concept in its JSON and no per-diagnostic fix payload, so
 * suppressed/fixable are always false; `help` text stays on the canonical
 * finding (report.json), while `url` lands here as help_url.
 */
export const extractOxlintViolations = ({
  raw,
  scopeValue,
  targetRootPath,
}: ExtractOxlintViolationsArgs): readonly LintViolationInput[] => {
  const scopeDirectory = path.resolve(targetRootPath, scopeValue);

  return raw.diagnostics.map((diagnostic) => {
    const absolute = diagnostic.filename.startsWith('/')
      ? diagnostic.filename
      : path.resolve(scopeDirectory, diagnostic.filename);
    const filePath = path.relative(targetRootPath, absolute);
    const span = diagnostic.labels?.[0]?.span;
    const ruleId = diagnostic.code ?? 'oxlint(unknown)';
    // Matches generate-oxlint-report.mjs's locationHint construction
    // exactly, so finding_id agrees with report.json's copy (ADR-028).
    const locationHint = span ? `${span.line}:${span.column}` : '';

    return {
      col: span?.column ?? undefined,
      file_path: filePath,
      finding_id: makeFindingId(
        ruleId,
        filePath,
        locationHint,
        diagnostic.message,
      ),
      fixable: false,
      help_url: diagnostic.url ?? undefined,
      line: span?.line ?? undefined,
      message: diagnostic.message,
      rule_id: ruleId,
      severity: diagnostic.severity === 'error' ? 'HIGH' : 'MEDIUM',
      severity_raw: diagnostic.severity,
      source: 'oxlint',
      suggestion_text: buildOxlintFixText(diagnostic, ruleId),
      suppressed: false,
    };
  });
};
