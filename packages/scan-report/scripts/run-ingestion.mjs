// The one ingestion step every scanner shares, and the one place that decides
// how each outcome is reported.
//
// The distinction is the point: an UNCONFIGURED ingest is a normal state and
// says so on stdout at exit 0, while a CONFIGURED ingest that fails is an
// error and exits non-zero. They used to be one best-effort warning, which is
// how a permanent breakage — the ingestion CLI moving out of the repository —
// could read as a transient blip for as long as nobody looked.
//
// Either way the report artifacts are already on disk and complete; ingestion
// only decides whether they were also persisted somewhere.

import {
  MISSING_INGEST_MESSAGE,
  resolveIngestConfig,
  runConfiguredIngest,
} from './ingest-configuration.mjs';

export const INGESTION_OUTCOMES = {
  failed: 'failed',
  ingested: 'ingested',
  skipped: 'skipped',
};

/**
 * @returns one of INGESTION_OUTCOMES. Sets `process.exitCode` on failure so the
 * caller does not have to remember to, and never throws.
 */
export const runIngestion = ({
  artifactsMessage,
  hostRoot,
  scanArguments,
  skipReason,
}) => {
  if (skipReason) {
    console.log(`Ingestion skipped: ${skipReason}.`);
    return INGESTION_OUTCOMES.skipped;
  }

  const config = resolveIngestConfig({ hostRoot });
  if (!config) {
    console.log(`Ingestion skipped: ${MISSING_INGEST_MESSAGE}.`);
    console.log(artifactsMessage);
    return INGESTION_OUTCOMES.skipped;
  }

  try {
    runConfiguredIngest({ config, hostRoot, scanArguments });
    return INGESTION_OUTCOMES.ingested;
  } catch (error) {
    console.error(
      `Ingestion FAILED: the configured command \`${config.command}\` did not complete — ${error.message}`,
    );
    console.error(artifactsMessage);
    process.exitCode = 1;
    return INGESTION_OUTCOMES.failed;
  }
};
