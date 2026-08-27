#!/usr/bin/env node

/**
 * Checks that every document a consumer installs reads correctly with only that
 * package on disk.
 *
 * It reads the PACKED TARBALL, not the working tree and not `files` in the
 * manifest, for the reason ADR-073 gives: the negated patterns a package leans
 * on to keep its internal documentation out are honoured by one packer and
 * ignored by another, and `publishConfig` is substituted by pnpm alone. So the
 * manifest states an intention and only the tarball states a fact — and the
 * fact this gate needs is precisely the one the source tree cannot show, since
 * every document is still sitting right there in it.
 *
 * There is deliberately no "nothing shipped, so nothing to check" outcome. An
 * empty package roster and a corpus of no documents are both refused, because
 * "every shipped document reads correctly" is trivially true of a set with no
 * documents in it and reads afterwards as a clean set.
 *
 * pnpm must be on PATH; `publish-pack.mjs` says why no other packer can stand
 * in.
 *
 * Usage (from the repository root): repo-verify-shipped-docs
 * Exit codes: 0 = every shipped document reads with only its package on disk,
 * 1 = one does not, or nothing was read (every finding is listed, not the
 * first).
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGates, readPublishing } from './config.mjs';
import { errorMessage } from './error-message.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { packAndRead } from './publish-pack.mjs';
import {
  emptyCorpusProblems,
  packageFindings,
  rosterProblem,
} from './shipped-docs.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * A state in which no verdict was earned, kept apart from a verdict of "these
 * documents are wrong". Both exit 1, and conflating them is how "read nothing"
 * comes to read as "found nothing".
 */
const refuse = (reasons) => {
  console.error('Shipped-docs gate refused to report a pass:\n');
  for (const reason of reasons) {
    console.error(`  - ${reason}`);
  }
  process.exitCode = 1;
};

const reportFailure = (findings) => {
  console.error(
    'Shipped documents do not read with only their package on disk:\n',
  );
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  console.error(
    `\n${findings.length} finding(s). Every one of these resolves in this repository and nowhere else, so only a packed tarball reports them.`,
  );
  process.exitCode = 1;
};

/** Packs each declared package and reads back what a consumer would receive. */
const checkPackedDocs = ({ packagesDir, publicPackageDirs, repoOnlyDirs }) => {
  const workDirectory = mkdtempSync(join(tmpdir(), 'shipped-docs-'));
  try {
    return publicPackageDirs.map((directory) => {
      const packed = packAndRead({
        destination: workDirectory,
        directory: join(REPO_ROOT, packagesDir, directory),
      });
      return packageFindings({
        files: packed.files,
        name: packed.name,
        readFile: packed.readFile,
        repoOnlyDirs,
      });
    });
  } finally {
    rmSync(workDirectory, { force: true, recursive: true });
  }
};

const main = () => {
  const { packagesDir, publicPackageDirs } = readPublishing(REPO_ROOT);
  const roster = rosterProblem(publicPackageDirs);
  if (roster !== undefined) {
    refuse([roster]);
    return;
  }

  const { shippedDocs } = readGates(REPO_ROOT);
  const results = checkPackedDocs({
    packagesDir,
    publicPackageDirs,
    repoOnlyDirs: shippedDocs.repoOnlyDirs,
  });

  // Per package, not over the roster: a package that ships nothing readable is
  // the reachable regression, and summing hides it behind its nine neighbours.
  const empty = emptyCorpusProblems(results);
  if (empty.length > 0) {
    refuse(empty);
    return;
  }

  const documents = results.reduce(
    (total, result) => total + result.documents.length,
    0,
  );
  const findings = results.flatMap((result) => result.findings);
  if (findings.length > 0) {
    reportFailure(findings);
    return;
  }

  console.log(
    `Shipped-docs gate passed: ${publicPackageDirs.length} package(s) packed, ${documents} installed document(s) read; every link, path and citation in them resolves with only the package on disk.`,
  );
};

try {
  main();
} catch (error) {
  console.error(`shipped-docs: ${errorMessage(error)}`);
  process.exitCode = 1;
}
