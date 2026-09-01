/**
 * Finding real `process.exit()` calls in a script's source.
 *
 * Parses rather than greps so a call in a comment is not a finding (ADR-090).
 */
import { Project, SyntaxKind } from 'ts-morph';

export const mayContainExitCall = (source) => source.includes('process.exit');

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
  skipLoadingLibFiles: true,
  useInMemoryFileSystem: true,
});

/**
 * @param {string} source
 * @param {string} [name] a filename for the parser; only affects diagnostics
 * @returns {{ line: number, text: string }[]}
 */
export const findProcessExitCalls = (source, name = 'script.js') => {
  if (!mayContainExitCall(source)) return [];

  const file = project.createSourceFile(name, source, { overwrite: true });

  try {
    return file
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => call.getExpression().getText() === 'process.exit')
      .map((call) => ({
        line: call.getStartLineNumber(),
        text: call.getText().replaceAll(/\s+/gu, ' '),
      }));
  } finally {
    file.delete();
  }
};
