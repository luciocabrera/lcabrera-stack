#!/usr/bin/env node
// The ingestion step for the skills whose findings come from an agent rather
// than from a tool (code-smell-checker, code-smell-zen): they write report.md
// and report.json themselves, then run this to persist them.
//
// It exists so a SKILL.md never has to spell out a product-specific command
// line. Everything it is given is forwarded verbatim to the configured
// ingestion command, so the argument contract belongs to that command, not to
// this file — which is what lets the same instruction text work in a repository
// that persists scans and in one that does not.
//
// Usage: scan-report-ingest --skill=<id> --run-dir=<dir> [any further flags]
// Exit : 0 when ingested or skipped, 1 when a configured ingestion failed.

import { fileURLToPath } from 'node:url';

import { resolveHostRoot } from './resolve-host-root.mjs';
import { INGESTION_OUTCOMES, runIngestion } from './run-ingestion.mjs';

const main = () => {
  const scanArguments = process.argv.slice(2);
  if (scanArguments.length === 0) {
    console.error(
      'scan-report-ingest: pass the ingestion flags to forward, e.g. --skill=<id> --run-dir=<dir>.',
    );
    process.exitCode = 1;
    return;
  }

  const outcome = runIngestion({
    artifactsMessage:
      'The report artifacts are untouched — only their persistence was skipped.',
    hostRoot: resolveHostRoot({
      moduleDirectory: fileURLToPath(new URL('.', import.meta.url)),
    }),
    scanArguments,
  });

  if (outcome === INGESTION_OUTCOMES.ingested) {
    console.log('Ingestion complete.');
  }
};

main();
