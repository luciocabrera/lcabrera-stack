/**
 * Prints how far the product is from its intent, read from the requirement
 * register: met against unmet, split by product line, persona and package, then
 * every unmet requirement with the issues that would move it.
 *
 * Why it prints and writes nothing: a distance is a measurement, and a
 * measurement in a tracked file is right on the day it is written and wrong
 * from the next commit, with nothing to say which (ADR-049, and
 * `docs/product/README.md`, which forbids a percentage in the register for the
 * same reason). Redirect stdout if you want to keep one — into a PR or an
 * issue, where it is dated.
 *
 * It resolves pointers; it never runs one. The report says so itself, because
 * a reader who assumes otherwise reads a declaration as a result.
 *
 * Usage (from the repo root):
 *   vp run product:distance
 *
 * Exit codes: 0 = report printed, 1 = the register could not be read, or held
 * no entries (an empty read must not print an authoritative-looking 0/0).
 */
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { readRegisters } from './lib/doc-register-read.mjs';
import { distanceReport } from './lib/doc-register-reports.mjs';

const main = () => {
  const { requirements, resolves, rootTasks } = readRegisters(process.cwd());
  if (requirements.length === 0) {
    throw new Error(
      'Product distance: read no requirements from docs/product/requirements. Refusing to report a distance from no data.',
    );
  }
  console.log(distanceReport({ requirements, resolves, rootTasks }));
};

try {
  main();
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
}
