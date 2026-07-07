import { isExistingPathWithin } from '../fs/isExistingPathWithin.util.ts';
import { makeDirectoryWithin } from '../fs/makeDirectoryWithin.util.ts';
import { writeTextFileWithin } from '../fs/writeTextFileWithin.util.ts';
import { buildRunnerScriptScaffold } from './buildRunnerScriptScaffold.util.ts';
import { buildSkillMarkdown } from './buildSkillMarkdown.util.ts';
import { resolveCqmsRepoRoot } from './resolveCqmsRepoRoot.util.ts';

export type WriteScannerArtifactsResult = {
  /** Repo-relative paths actually written this call (empty = all existed). */
  readonly writtenPaths: readonly string[];
};

type WriteScannerArtifactsArgs = {
  readonly allowedTools?: readonly string[];
  readonly description?: string;
  readonly displayName: string;
  readonly isDeterministic: boolean;
  readonly rawArtifactFileName?: string;
  /** Override for tests — defaults to the real CQMS repo root. */
  readonly repoRoot?: string;
  readonly scannerId: string;
  readonly stepsMarkdown?: string;
};

/**
 * Assembles a registered scanner's on-disk artifacts from templates
 * (ADR-023): SKILL.md for LLM scanners, a runner-script scaffold with a
 * TODO parser block for deterministic ones — into
 * `.github/skills/<scanner_id>/`. STRICTLY create-if-missing: an existing
 * file is never touched, because the code on disk (not the registry row)
 * stays authoritative. All writes go through the fs/*Within containment
 * gates against the CQMS repo root.
 */
export const writeScannerArtifacts = ({
  allowedTools,
  description,
  displayName,
  isDeterministic,
  rawArtifactFileName,
  repoRoot,
  scannerId,
  stepsMarkdown,
}: WriteScannerArtifactsArgs): WriteScannerArtifactsResult => {
  const baseDirectory = repoRoot ?? resolveCqmsRepoRoot();
  const skillDirectory = `.github/skills/${scannerId}`;
  const writtenPaths: string[] = [];

  if (isDeterministic) {
    const scriptPath = `${skillDirectory}/scripts/generate-${scannerId}-report.mjs`;
    if (!isExistingPathWithin({ baseDirectory, targetPath: scriptPath })) {
      makeDirectoryWithin({
        baseDirectory,
        targetPath: `${skillDirectory}/scripts`,
      });
      writeTextFileWithin({
        baseDirectory,
        content: buildRunnerScriptScaffold({
          displayName,
          rawArtifactFileName,
          scannerId,
        }),
        targetPath: scriptPath,
      });
      writtenPaths.push(scriptPath);
    }
    return { writtenPaths };
  }

  const skillMarkdownPath = `${skillDirectory}/SKILL.md`;
  if (!isExistingPathWithin({ baseDirectory, targetPath: skillMarkdownPath })) {
    makeDirectoryWithin({ baseDirectory, targetPath: skillDirectory });
    writeTextFileWithin({
      baseDirectory,
      content: buildSkillMarkdown({
        allowedTools,
        description,
        displayName,
        scannerId,
        stepsMarkdown,
      }),
      targetPath: skillMarkdownPath,
    });
    writtenPaths.push(skillMarkdownPath);
  }
  return { writtenPaths };
};
