import { isExistingPathWithin } from '../../fs/isExistingPathWithin.util.ts';
import { readTextFileWithin } from '../../fs/readTextFileWithin.util.ts';
import { parsePackageJsonWorkspaces } from './parsePackageJsonWorkspaces.util.ts';
import { parsePnpmWorkspaceGlobs } from './parsePnpmWorkspaceGlobs.util.ts';

/**
 * The raw workspace globs a repo root declares (ADR-021):
 * pnpm-workspace.yaml's `packages:` list wins when the file exists, else
 * the root package.json's `workspaces` field. Throws when neither file is
 * readable — the discovery entry point catches and degrades to [].
 */
export const readWorkspaceGlobs = (rootPath: string): readonly string[] => {
  const hasPnpmWorkspaceFile = isExistingPathWithin({
    baseDirectory: rootPath,
    targetPath: 'pnpm-workspace.yaml',
  });
  if (hasPnpmWorkspaceFile) {
    const yamlText = readTextFileWithin({
      baseDirectory: rootPath,
      targetPath: 'pnpm-workspace.yaml',
    });
    return parsePnpmWorkspaceGlobs(yamlText);
  }

  const packageJsonText = readTextFileWithin({
    baseDirectory: rootPath,
    targetPath: 'package.json',
  });
  return parsePackageJsonWorkspaces(JSON.parse(packageJsonText));
};
