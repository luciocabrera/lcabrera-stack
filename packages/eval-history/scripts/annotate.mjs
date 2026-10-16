/**
 * Records a timeline note in evals.eval_annotation, so a shift in the history
 * can be read against what happened: a model change, a harness change, an
 * incident. The author is the GitHub actor, else git's user.email local part.
 *
 * Usage: vp run evals:annotate -- --kind <model-change|harness-change|incident|note> [--at <ISO time>] "<text>"
 * Exit codes: 0 recorded; 1 on an invalid env, kind, time or text, or a failed
 * statement.
 */
import process from 'node:process';
import { parseArgs } from 'node:util';

import { annotationSchema } from '../src/annotations/annotation.schema.ts';
import { recordAnnotation } from '../src/annotations/recordAnnotation.service.ts';
import {
  cliArguments,
  currentAuthor,
  databaseUrl,
  errorText,
  withEvalsClient,
} from './lib/evals-cli.mjs';

const annotationFrom = (args) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args,
    options: { at: { type: 'string' }, kind: { type: 'string' } },
  });
  return annotationSchema.parse({
    at: values.at ?? new Date().toISOString(),
    author: currentAuthor(),
    kind: values.kind,
    text: positionals.join(' '),
  });
};

try {
  const annotation = annotationFrom(cliArguments());
  const recorded = await withEvalsClient(databaseUrl(), (client) =>
    recordAnnotation({ annotation, client }),
  );
  console.log(
    `evals:annotate: recorded ${recorded.kind} annotation ${recorded.id} at ${recorded.at.toISOString()}`,
  );
} catch (error) {
  console.error(`evals:annotate: ${errorText(error)}`);
  process.exitCode = 1;
}
