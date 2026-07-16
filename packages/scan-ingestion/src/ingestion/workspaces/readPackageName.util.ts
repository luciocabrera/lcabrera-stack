import { readTextFileWithin } from '../../fs/readTextFileWithin.util.ts';

/**
 * The `name` field of a directory's package.json, or undefined when the
 * file is missing/unparseable/nameless — discovery is best-effort and a
 * workspace without a readable name is still a workspace (ADR-021).
 */
export const readPackageName = (directoryPath: string): string | undefined => {
  try {
    const packageJsonText = readTextFileWithin({
      baseDirectory: directoryPath,
      targetPath: 'package.json',
    });
    const parsed: unknown = JSON.parse(packageJsonText);
    const name =
      parsed !== null && typeof parsed === 'object'
        ? (parsed as { name?: unknown }).name
        : undefined;
    return typeof name === 'string' && name.length > 0 ? name : undefined;
  } catch {
    return undefined;
  }
};
