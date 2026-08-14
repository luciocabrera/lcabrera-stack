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
// only decides whether they were also persisted somewhere. Nothing below may
// throw: a scanner that wrote its three files has done its job, and letting a
// persistence problem surface as a stack trace loses that.

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
 * A description of anything that was thrown.
 *
 * `error.message` is only safe on an Error: `throw null` and `throw 'text'` are
 * both legal, and reading `.message` off the first one throws again from inside
 * the handler meant to contain it.
 */
const describeError = (error) => {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message;
  }
  try {
    return String(error);
  } catch {
    return 'an unprintable value was thrown';
  }
};

/** Resolves the configuration, turning a malformed one into a failure rather than a crash. */
const readConfig = (hostRoot) => {
  try {
    return { config: resolveIngestConfig({ hostRoot }) };
  } catch (error) {
    return {
      failure: `its configuration could not be read — ${describeError(error)}`,
    };
  }
};

const reportFailure = ({ artifactsMessage, detail }) => {
  console.error(`Ingestion FAILED: ${detail}`);
  console.error(artifactsMessage);
  process.exitCode = 1;
  return INGESTION_OUTCOMES.failed;
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

  // A configuration that exists but cannot be parsed is a failure, not a skip:
  // the host meant to configure something and got it wrong, which is exactly
  // the case that must not read like "nothing to do here".
  const { config, failure } = readConfig(hostRoot);
  if (failure) return reportFailure({ artifactsMessage, detail: failure });

  if (!config) {
    console.log(`Ingestion skipped: ${MISSING_INGEST_MESSAGE}.`);
    console.log(artifactsMessage);
    return INGESTION_OUTCOMES.skipped;
  }

  try {
    runConfiguredIngest({ config, hostRoot, scanArguments });
    return INGESTION_OUTCOMES.ingested;
  } catch (error) {
    return reportFailure({
      artifactsMessage,
      detail: `the configured command \`${config.command}\` did not complete — ${describeError(error)}`,
    });
  }
};
