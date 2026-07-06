import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import { cqmsRepoRoot } from '../cqmsRepoRoot.util.ts';

/**
 * The single trusted base for orchestrator scratch output
 * (.tmp/scan-orchestrator/<scan_id>/ — TECH_SPEC §2.7). Every fs access in
 * this module goes through resolveContainedPath first, so a scan id or file
 * name can never traverse outside this directory.
 */
const SCAN_OUTPUT_BASE_DIRECTORY = path.join(
  cqmsRepoRoot,
  '.tmp',
  'scan-orchestrator',
);

type ResolveContainedPathArgs = {
  readonly segments: readonly string[];
};

const resolveContainedPath = ({
  segments,
}: ResolveContainedPathArgs): string => {
  const resolvedPath = path.resolve(SCAN_OUTPUT_BASE_DIRECTORY, ...segments);
  const relativePath = path.relative(SCAN_OUTPUT_BASE_DIRECTORY, resolvedPath);
  if (
    relativePath.length === 0 ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(
      `Refusing to access path outside ${SCAN_OUTPUT_BASE_DIRECTORY}: ${resolvedPath}`,
    );
  }
  return resolvedPath;
};

type CreateScanOutputDirectoryArgs = {
  readonly scanId: string;
};

/** Creates (recursively) and returns .tmp/scan-orchestrator/<scanId>. */
export const createScanOutputDirectory = ({
  scanId,
}: CreateScanOutputDirectoryArgs): string => {
  const outputDirectory = resolveContainedPath({ segments: [scanId] });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- outputDirectory was resolved and containment-validated against SCAN_OUTPUT_BASE_DIRECTORY by resolveContainedPath just above
  mkdirSync(outputDirectory, { recursive: true });
  return outputDirectory;
};

type GetScanOutputPathIfExistsArgs = {
  readonly fileName: string;
  readonly scanId: string;
};

/**
 * Returns the absolute path of a file inside the scan's output directory,
 * or undefined when the file was not produced.
 */
export const getScanOutputPathIfExists = ({
  fileName,
  scanId,
}: GetScanOutputPathIfExistsArgs): string | undefined => {
  const filePath = resolveContainedPath({ segments: [scanId, fileName] });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath was resolved and containment-validated against SCAN_OUTPUT_BASE_DIRECTORY by resolveContainedPath just above
  return existsSync(filePath) ? filePath : undefined;
};
