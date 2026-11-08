/**
 * The run behind `vp run adjudicate:rule`: records the repository owner's
 * ruling on a case the panel left to them, a split or a fix that cannot be
 * applied, with every effect passed in so a test can see what it writes.
 * ADR-147 is the policy; the ruling's shape is the adjudication envelope's.
 */
import { toCurrentAdjudication } from '@repo/eval-history/envelope/toCurrentAdjudication.util';
import { parseArgs } from 'node:util';

import { CASES_DIR } from './adjudicate-command.mjs';
import { listWithEntry, markerInstruction } from './adjudication-panel.mjs';
import { expiryFor } from './false-positives.mjs';
import { caseIdFrom } from './tool-paths.mjs';

const USAGE =
  'usage: vp run adjudicate:rule -- <FP-nnnn> --verdict <FALSE_POSITIVE|REAL> --by <github login> --reference <https url> [--at <YYYY-MM-DD>]';

const readInput = ({ argv, today }) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv[0] === '--' ? argv.slice(1) : argv,
    options: {
      at: { type: 'string' },
      by: { type: 'string' },
      reference: { type: 'string' },
      verdict: { type: 'string' },
    },
    strict: true,
  });
  const [named, ...extra] = positionals;
  if (named === undefined || extra.length !== 0) throw new Error(USAGE);
  return {
    caseId: caseIdFrom(named),
    ruling: {
      at: values.at ?? today,
      by: values.by,
      reference: values.reference,
      verdict: values.verdict,
    },
  };
};

const ruledEnvelope = ({ caseId, record, ruling }) => {
  if (record === undefined) {
    throw new Error(
      `${caseId} has no panel record; run vp run adjudicate:panel -- ${caseId} first`,
    );
  }
  if (record.owner_ruling !== undefined) {
    throw new Error(
      `${caseId} already carries ${record.owner_ruling.by}'s ruling of ${record.owner_ruling.at}; a ruling is never overwritten`,
    );
  }
  const envelope = { ...record, owner_ruling: ruling };
  const checked = toCurrentAdjudication({ input: envelope });
  if (!checked.ok) {
    throw new Error(
      `the ruling does not make a valid envelope:\n  ${checked.problems.join('\n  ')}\n${USAGE}`,
    );
  }
  return envelope;
};

const dismissal = ({ caseFile, effects, evidence, ruling, today }) => {
  const expires = expiryFor(ruling.at);
  if (expires < today) {
    throw new Error(
      `a ruling dated ${ruling.at} gives a list entry that expired on ${expires}, six months later; rule again with today's date`,
    );
  }
  const list = effects.readList() ?? [];
  if (list.some((entry) => entry.case === caseFile.case.case_id)) {
    throw new Error(
      `${effects.listPath} already holds ${caseFile.case.case_id}`,
    );
  }
  return listWithEntry({ caseFile, evidence, from: ruling.at, list });
};

export const recordRuling = ({ argv, effects }) => {
  const today = effects.today();
  const { caseId, ruling } = readInput({ argv, today });
  const evidence = `${CASES_DIR}/${caseId}.json`;
  const envelope = ruledEnvelope({
    caseId,
    record: effects.readJson(evidence),
    ruling,
  });
  if (ruling.verdict === 'REAL') {
    effects.writeJson(evidence, envelope);
    effects.write(
      `Recorded ${ruling.by}'s REAL ruling in ${evidence}. Fix the finding; there is no marker and no list entry.\n`,
    );
    return 0;
  }
  const caseFile = effects.readJson(`${CASES_DIR}/${caseId}/case.json`);
  if (caseFile === undefined) {
    throw new Error(`${CASES_DIR}/${caseId}/case.json does not exist`);
  }
  const list = dismissal({ caseFile, effects, evidence, ruling, today });
  effects.writeJson(evidence, envelope);
  effects.writeJson(effects.listPath, list);
  effects.write(
    `Recorded ${ruling.by}'s FALSE_POSITIVE ruling in ${evidence} and the ${effects.listPath} entry. ${markerInstruction(caseFile)}`,
  );
  return 0;
};
