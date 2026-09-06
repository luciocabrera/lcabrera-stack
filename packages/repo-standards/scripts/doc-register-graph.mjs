/**
 * The two rules that are about the register rather than about one entry: a
 * duplicate id, and a `requires` cycle.
 *
 * Their own module because each needs every entry at once, which is a different
 * shape from the per-entry rules in `doc-register-checks.mjs` — and because that
 * file had reached the size ceiling `.claude/rules/scripts.md` sets.
 *
 * Both are pure.
 */
import { stringList } from './doc-registers.mjs';

export const duplicateIdFindings = (entries) => {
  const seen = new Map();
  const findings = [];
  for (const entry of entries) {
    const id =
      typeof entry.fields.id === 'string' ? entry.fields.id : entry.slug;
    const owner = seen.get(id);
    if (owner === undefined) {
      seen.set(id, entry.file);
      continue;
    }
    findings.push({
      file: entry.file,
      message: `duplicate id \`${id}\` — already declared by \`${owner}\``,
    });
  }
  return findings;
};

const cycleFrom = (start, edges, settled) => {
  const path = [];
  const onPath = new Set();
  const stack = [{ id: start, rest: [...(edges.get(start) ?? [])] }];
  while (stack.length > 0) {
    const frame = stack.at(-1);
    if (!onPath.has(frame.id)) {
      path.push(frame.id);
      onPath.add(frame.id);
    }
    const next = frame.rest.shift();
    if (next === undefined) {
      settled.add(path.pop());
      onPath.delete(frame.id);
      stack.pop();
      continue;
    }
    if (onPath.has(next)) {
      return [...path.slice(path.indexOf(next)), next];
    }
    if (!settled.has(next)) {
      stack.push({ id: next, rest: [...(edges.get(next) ?? [])] });
    }
  }
  return undefined;
};

export const cycleFindings = (entries) => {
  const edges = new Map(
    entries.map((entry) => [
      entry.slug,
      [...(stringList(entry.fields, 'requires') ?? [])],
    ]),
  );
  const fileBySlug = new Map(entries.map((entry) => [entry.slug, entry.file]));
  const settled = new Set();
  const findings = [];
  for (const entry of entries) {
    if (settled.has(entry.slug)) {
      continue;
    }
    const cycle = cycleFrom(entry.slug, edges, settled);
    if (cycle !== undefined) {
      findings.push({
        file: fileBySlug.get(cycle[0]) ?? entry.file,
        message: `\`requires\` cycle: ${cycle.join(' → ')}`,
      });
      for (const id of cycle) {
        settled.add(id);
      }
    }
  }
  return findings;
};
