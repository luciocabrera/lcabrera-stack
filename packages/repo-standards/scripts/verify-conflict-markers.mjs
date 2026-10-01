#!/usr/bin/env node
/**
 * Fails when a tracked file still carries a merge-conflict marker, including
 * one a Markdown formatter has already reshaped so that `git diff --check` and
 * a search for the raw marker both miss it. The patterns are in
 * `./conflict-markers.mjs`. A tracked file it cannot read fails the run too,
 * because a pass has to mean every tracked file was read.
 *
 * Usage: repo-verify-conflict-markers
 * Exit codes: 0 = every tracked file was read and none carries a marker,
 * 1 = one does, one could not be read, or git listed no files.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  conflictMarkerLines,
  formatFinding,
  isBinaryContent,
} from './conflict-markers.mjs';
import { regularFiles } from './departed-names.mjs';
import { errorMessage } from './error-message.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const trackedFiles = () => {
  const output = runGit({ args: ['ls-files', '-s', '-z'], cwd: REPO_ROOT });
  const files = output === undefined ? [] : regularFiles(output);
  if (files.length === 0) {
    throw new Error(
      '`git ls-files` listed no tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return files;
};

const readBytes = (path) => {
  try {
    return { bytes: readFileSync(resolve(REPO_ROOT, path)) };
  } catch (error) {
    return { reason: error.code ?? errorMessage(error) };
  }
};

const scanFile = (path) => {
  const { bytes, reason } = readBytes(path);
  if (bytes === undefined) return { unreadable: `${path} (${reason})` };
  if (isBinaryContent(bytes)) return { binary: true, findings: [] };
  return {
    findings: conflictMarkerLines(bytes.toString('utf8')).map((marker) => ({
      ...marker,
      path,
    })),
  };
};

const scanTree = (paths) => {
  const findings = [];
  const unreadable = [];
  let binaries = 0;
  for (const path of paths) {
    const result = scanFile(path);
    if (result.unreadable === undefined) {
      findings.push(...result.findings);
      binaries += result.binary === true ? 1 : 0;
    } else {
      unreadable.push(result.unreadable);
    }
  }
  return { binaries, findings, unreadable };
};

const reportFindings = (findings) => {
  process.stderr.write(
    'These tracked lines are merge-conflict markers left by an unfinished merge:\n\n',
  );
  for (const finding of findings) {
    process.stderr.write(`  ${formatFinding(finding)}\n`);
  }
  process.stderr.write(
    '\nResolve the conflict in each file: keep the side you want, then delete\n' +
      'the marker lines. A formatter may have rewritten a marker into a block\n' +
      'quote, a table cell or an indented line, so check the lines around each\n' +
      'one as well.\n\n',
  );
};

const reportUnreadable = (unreadable) => {
  process.stderr.write(
    `These ${unreadable.length} tracked file(s) could not be read, so the gate cannot say they carry no marker:\n\n`,
  );
  for (const entry of unreadable) process.stderr.write(`  ${entry}\n`);
  process.stderr.write(
    '\nRestore a file deleted by mistake, or `git rm` one whose deletion is\n' +
      'intended. A sparse checkout leaves files out on purpose: run this gate\n' +
      'in a full checkout.\n',
  );
};

const main = () => {
  const paths = trackedFiles();
  const { binaries, findings, unreadable } = scanTree(paths);

  if (findings.length > 0) reportFindings(findings);
  if (unreadable.length > 0) reportUnreadable(unreadable);
  if (findings.length > 0 || unreadable.length > 0) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Conflict-marker gate passed: ${paths.length} tracked file(s) read (${binaries} binary, skipped), none carries a marker.\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`verify-conflict-markers: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
