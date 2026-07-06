import path from 'node:path';

import type { EslintMessage, EslintRaw } from './eslintRaw.schema.ts';
import type { LintViolationInput } from './lintViolation.types.ts';

type ExtractEslintViolationsArgs = {
  /** The registered project root — file_path is stored relative to it (workspace attribution relies on this). */
  readonly localPath: string;
  readonly raw: EslintRaw;
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
  return {
    col: message.column ?? undefined,
    end_col: message.endColumn ?? undefined,
    end_line: message.endLine ?? undefined,
    file_path: filePath,
    fixable: Boolean(message.fix),
    line: message.line ?? undefined,
    message: message.message,
    message_id: message.messageId ?? undefined,
    rule_id: message.ruleId ?? 'eslint(unknown)',
    severity: message.severity === 2 ? 'HIGH' : 'MEDIUM',
    severity_raw: String(message.severity),
    source: 'eslint',
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
  localPath,
  raw,
}: ExtractEslintViolationsArgs): readonly LintViolationInput[] =>
  raw.results.flatMap((fileResult) => {
    const filePath = fileResult.filePath.startsWith('/')
      ? path.relative(localPath, fileResult.filePath)
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
