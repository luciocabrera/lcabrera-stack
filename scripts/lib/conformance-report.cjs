/**
 * Printing for the conformance entry points: the findings, the directories
 * skipped, the exit code.
 *
 * Why: two CLIs report the same run, and a second copy of the printer is how
 * they would drift into disagreeing about what a failure looks like.
 * Usage: `require('./lib/conformance-report.cjs').reportConformance(...)`.
 */
'use strict';

/**
 * @param {{
 *   failureHeading: string;
 *   messages: readonly string[];
 *   passedMessage: string;
 *   skippedDirectories: readonly string[];
 * }} args
 * @returns {number}
 */
const reportConformance = ({
  failureHeading,
  messages,
  passedMessage,
  skippedDirectories,
}) => {
  if (messages.length > 0) {
    console.error(failureHeading);
    for (const message of messages) {
      console.error(`- ${message}`);
    }
    return 1;
  }

  console.log(passedMessage);

  if (skippedDirectories.length > 0) {
    console.log(
      `Skipped support directories: ${skippedDirectories.join(', ')}`,
    );
  }

  return 0;
};

module.exports = {
  reportConformance,
};
