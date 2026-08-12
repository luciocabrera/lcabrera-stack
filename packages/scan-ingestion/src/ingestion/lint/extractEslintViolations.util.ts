import path from 'node:path';

import type { EslintMessage, EslintRaw } from './eslintRaw.schema.ts';
import type { LintViolationInput } from './lint.types.ts';

import { makeFindingId } from '../../../../../.github/skills/code-smell-shared/scripts/deterministic-scan-shared.mjs';
import { buildEslintFixText } from '../../../../../.github/skills/code-smell-shared/scripts/finding-templates.mjs';

type ExtractEslintViolationsArgs = {
  readonly raw: EslintRaw;
  /** The scan's target root (snapshot dir for UI runs, ADR-028) — file_path is stored relative to it (workspace attribution relies on this). */
  readonly targetRootPath: string;
};

type MapMessageArgs = {
  readonly filePath: string;
  readonly message: EslintMessage;
  readonly suppressed: boolean;
};

const mapMessage = ({
  filePath,
  message,
  suppressed,
}: MapMessageArgs): LintViolationInput => {
  const suppression = message.suppressions?.[0];
  const ruleId = message.ruleId ?? 'eslint(unknown)';
  // Matches generate-eslint-report.mjs's locationHint construction exactly
  // (`${message.line}:${message.column}`) so finding_id agrees with
  // report.json's copy of the same fact (ADR-028).
  const locationHint = `${message.line}:${message.column}`;
  return {
    col: message.column ?? undefined,
    end_col: message.endColumn ?? undefined,
    end_line: message.endLine ?? undefined,
    file_path: filePath,
    finding_id: makeFindingId(ruleId, filePath, locationHint, message.message),
    fixable: Boolean(message.fix),
    line: message.line ?? undefined,
    message: message.message,
    message_id: message.messageId ?? undefined,
    rule_id: ruleId,
    severity: message.severity === 2 ? 'HIGH' : 'MEDIUM',
    severity_raw: String(message.severity),
    source: 'eslint',
    suggestion_text: buildEslintFixText(message, ruleId),
    suppressed,
    suppression_justification: suppression?.justification ?? undefined,
    suppression_kind: suppression?.kind ?? undefined,
  };
};

/**
 * Explodes an eslint result array into cqms.lint_violations rows —
 * including `suppressedMessages` (suppressed: true, with kind/
 * justification): baselined lint debt is queryable data, not noise
 * (ADR-019). eslint reports absolute file paths; they are stored
 * project-root-relative so the workspace-attribution prefix views work.
 */
export const extractEslintViolations = ({
  raw,
  targetRootPath,
}: ExtractEslintViolationsArgs): readonly LintViolationInput[] =>
  raw.results.flatMap((fileResult) => {
    const filePath = fileResult.filePath.startsWith('/')
      ? path.relative(targetRootPath, fileResult.filePath)
      : fileResult.filePath;
    return [
      ...fileResult.messages.map((message) =>
        mapMessage({ filePath, message, suppressed: false }),
      ),
      ...fileResult.suppressedMessages.map((message) =>
        mapMessage({ filePath, message, suppressed: true }),
      ),
    ];
  });
