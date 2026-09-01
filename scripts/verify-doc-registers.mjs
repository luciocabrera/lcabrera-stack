/**
 * Fails the build when the product-requirement register or the planning-document
 * register says something no longer true: a malformed entry, a duplicate id, an
 * evidence pointer that resolves to nothing, a `requires` cycle, a package name
 * no workspace answers to, a `met` requirement with no command CI runs behind
 * it, or a plan whose work was never filed as an issue.
 *
 * Why: both registers are prose until something reads them, and an unenforced
 * document is one that rots — the same reason `commands:verify`, `docs:verify`
 * and `scripts:verify` exist. The rules are the ones stated in
 * `docs/product/README.md` and `docs/agents/planning/README.md`; the schemas
 * live in `lib/doc-registers.mjs` and the rules in `lib/doc-register-checks.mjs`.
 *
 * Reading nothing FAILS. An empty register and a clean one are indistinguishable
 * in an exit code, so the empty read is refused rather than reported as a pass.
 *
 * One rule is half-checked on purpose. A `met` requirement must point at a
 * command CI runs AND that could fail; only the first half is decidable from
 * the tree, and the success line says so rather than letting a reader assume
 * both were covered.
 *
 * Usage (from the repo root):
 *   vp run registers:verify
 *   node scripts/verify-doc-registers.mjs
 *
 * Exit codes: 0 = both registers hold, 1 = at least one entry does not (every
 * finding is listed, not just the first).
 */
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import {
  carriesPlanningBlock,
  registerFindings,
} from './lib/doc-register-checks.mjs';
import { readRegisters } from './lib/doc-register-read.mjs';
import { commandTask } from './lib/doc-registers.mjs';

const reportFindings = (findings) => {
  console.error(`Doc registers — ${findings.length} problem(s):\n`);
  for (const { file, message } of findings) {
    console.error(`  - ${file}: ${message}`);
  }
  console.error('\nThe two schemas are stated in docs/product/README.md and');
  console.error(
    'docs/agents/planning/README.md. Fix the entry in the same commit as the',
  );
  console.error('change that moved it — there is nothing to baseline here.');
};

const backedCount = (requirements, ciCommands) =>
  requirements.filter(
    (entry) =>
      entry.fields.state === 'met' &&
      (entry.fields.evidence ?? []).some((pointer) =>
        ciCommands.has(commandTask(pointer.ref ?? '') ?? ''),
      ),
  ).length;

const main = () => {
  const registers = readRegisters(process.cwd());
  const findings = registerFindings(registers);
  if (findings.length > 0) {
    reportFindings(findings);
    process.exitCode = 1;
    return;
  }
  const { ciCommands, planning, requirements } = registers;
  const checked = planning.filter(carriesPlanningBlock);
  console.log(
    `Doc registers hold: ${requirements.length} requirement(s), ` +
      `${checked.length} planning document(s) ` +
      `(${planning.length - checked.length} draft(s) carrying no block, by charter), ` +
      `${backedCount(requirements, ciCommands)} met and pointing at a command CI runs.`,
  );
  console.log(
    'Not checked, and not checkable here: whether those commands COULD fail.',
  );
  console.log(
    'Break the property on purpose and watch the pointer fail before declaring',
  );
  console.log('`met` — docs/product/README.md owns that procedure.');
};

try {
  main();
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
}
