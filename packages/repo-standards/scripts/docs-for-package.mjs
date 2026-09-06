#!/usr/bin/env node
/**
 * Lists every document that concerns one package — the requirements it owes and
 * the planning documents that name it — by reading the `packages:` field both
 * registers declare.
 *
 * Why: the question was a grep, and a grep answers with every file that merely
 * mentions the name. A declaration is a different thing from a mention, and
 * only the register carries one. Names are workspace DIRECTORIES (`node-runtime`),
 * not npm names, and are checked against the roster derived from
 * `pnpm-workspace.yaml` — a typo lists nothing, which reads exactly like a
 * package that owes nothing.
 *
 * Reads the working tree only: no network, no GitHub, and it writes no file.
 *
 * Usage (from the repo root):
 *   repo-docs-for-package ui
 *
 * Exit codes: 0 = listing printed, 1 = no workspace named, or a name no
 * workspace answers to.
 */
import { readRegisters as readRegisterConfig } from './config.mjs';
import { readRegisters } from './doc-register-read.mjs';
import { packageDocsReport } from './doc-register-reports.mjs';
import { documentsForPackage } from './doc-registers.mjs';
import { errorMessage } from './error-message.mjs';

const namedWorkspace = () =>
  process.argv.slice(2).find((argument) => !argument.startsWith('-'));

const main = () => {
  const { planning, requirements, roster } = readRegisters(
    process.cwd(),
    readRegisterConfig(process.cwd()),
  );
  const workspace = namedWorkspace();
  const known = [...roster].sort((a, b) => a.localeCompare(b)).join(', ');
  if (workspace === undefined) {
    throw new Error(
      `docs:for-package: name a workspace directory. One of: ${known}`,
    );
  }
  if (!roster.has(workspace)) {
    throw new Error(
      `docs:for-package: \`${workspace}\` is not a workspace directory. One of: ${known}`,
    );
  }
  console.log(
    packageDocsReport({
      planning: documentsForPackage(planning, workspace),
      requirements: documentsForPackage(requirements, workspace),
      workspace,
    }),
  );
};

try {
  main();
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
}
