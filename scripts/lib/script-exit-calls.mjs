/**
 * Finding real `process.exit()` calls in a script's source.
 *
 * Why this exists: `.claude/rules/scripts.md` forbids exiting mid-stream —
 * stderr is asynchronous when it is a pipe, so the call can drop the very
 * message explaining the failure, under CI and `tee` exactly. The rule was
 * stated only in prose, so it was broken as easily in new files as in old
 * ones (#929).
 *
 * It parses rather than greps, and that is the whole design. The naive regex
 * fails the first file that DOCUMENTS the rule: a comment reading "never call
 * `process.exit()` here" is not a violation, and a gate that cannot tell the
 * two apart punishes the files following it most carefully.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { Project, SyntaxKind } from 'ts-morph';

/** Cheap pre-filter: parsing every script in the repo is not worth it. */
export const mayContainExitCall = (source) => source.includes('process.exit');

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
  skipLoadingLibFiles: true,
  useInMemoryFileSystem: true,
});

/**
 * Every `process.exit(...)` call in `source`, with its 1-indexed line.
 *
 * `process.exitCode = 1` is an assignment, not a call, so it never appears here
 * — which is the point, since it is the form the rule asks for.
 *
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
