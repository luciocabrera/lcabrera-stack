#!/usr/bin/env node
/**
 * Runs one fallow analysis as a gate over the source files a change touched.
 * fallow reports several of these analyses with exit 0 whatever it finds, so a
 * hook or CI step that ran them bare would pass on every finding. The run is
 * `./fallow-gate-command.mjs`; the verdicts are `./fallow-gate.mjs`.
 *
 * Usage:
 *   … | repo-fallow-gate <analysis>             changed files on stdin
 *   repo-fallow-gate <analysis> [--] <file>…    the files to check, as from a hook
 * `coverage-gaps`, `security` and `mutation` also read the merge base from
 * CHANGED_FILES_BASE.
 *
 * Exit codes: 0 = no finding; 1 = a finding (8 for a new security candidate,
 * fallow's own code); 4 = the analysis could not run, which covers every
 * other exit fallow gives.
 */
import { runFallowGateCommand } from './fallow-gate-command.mjs';

process.exitCode = runFallowGateCommand(process);
