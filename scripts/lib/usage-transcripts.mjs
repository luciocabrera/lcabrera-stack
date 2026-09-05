/**
 * Counts Skill and subagent invocations per day, out of the Claude Code
 * transcripts on this machine, for the working trees of this repository.
 *
 * Transcripts are the only store that records an invocation at all, and the
 * only one that expires, which is why the caller merges them with a snapshot.
 * Three constraints hold here: the reader reports whether it could read
 * separately from what it found; `since` narrows the read only for a run
 * simulating expiry, never for the window; and a path that vanishes between
 * being listed and being read is reported and skipped rather than thrown.
 *
 * What the caller may record as observed hangs on what this reader says about
 * its own read, so both of those claims are built to under-claim. `complete`
 * says nothing was left out: every result comes from one constructor whose
 * default vouches for nothing, and `complete` holds only for a result built from
 * at least one in-scope transcript with nothing on the skipped list. `readFrom`
 * says how far back the read was allowed to look — it echoes the `since` this
 * reader was handed, so a run that read under a horizon of its own is visible as
 * such to the caller rather than being mistaken for a read of everything on
 * disk. The two are separate because a narrowed read is not a failed one; it
 * counts what it found honestly, and only the coverage claim is off. Everything
 * left out lands on that one list — a directory that would not list, a file
 * that would not open, a file recording a tool call it names no directory for,
 * a record naming a tool call that would not parse — so a new way to leave
 * something out suppresses the claim by recording itself, rather than by a new
 * test where the claim is made. The unit of loss is a call that went uncounted,
 * which is why a file holding no tool call at all is no loss whatever else it
 * is missing: session pointers carrying neither are ordinary. The one thing the
 * list cannot hold: a truncation that also removed the tool-call marker reads
 * exactly like a line that holds no invocation, and nothing can tell those
 * apart.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { isWithinAny, namesADirectoryUnderAny } from './usage-scope.mjs';
import { dayOf } from './usage-window.mjs';

const SKILL_TOOL = 'Skill';
const SUBAGENT_TOOLS = new Set(['Agent', 'Task']);
const UNNAMED_SUBAGENT = 'unnamed subagent';

export const transcriptsRoot = () => join(homedir(), '.claude', 'projects');

const mightHoldInvocation = (line) =>
  line.includes('"tool_use"') &&
  (line.includes(SKILL_TOOL) ||
    line.includes('Agent') ||
    line.includes('Task'));

const invocationIn = (block) => {
  if (block?.type !== 'tool_use') {
    return undefined;
  }
  if (block.name === SKILL_TOOL && typeof block.input?.skill === 'string') {
    return { kind: 'skills', name: block.input.skill };
  }
  if (SUBAGENT_TOOLS.has(block.name)) {
    const name = block.input?.subagent_type ?? block.input?.agent_type;
    return {
      kind: 'subagents',
      name:
        typeof name === 'string' && name.length > 0 ? name : UNNAMED_SUBAGENT,
    };
  }
  return undefined;
};

export const invocationsInEntry = ({ entry, roots }) => {
  const content = entry?.message?.content;
  if (!Array.isArray(content) || !isWithinAny({ path: entry.cwd, roots })) {
    return [];
  }
  const day = dayOf(entry.timestamp);
  return content
    .map((block) => invocationIn(block))
    .filter((found) => found !== undefined)
    .map((found) => ({ ...found, day }));
};

const parseEntry = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
};

const readLines = (path) => {
  try {
    return { lines: readFileSync(path, 'utf8').split('\n') };
  } catch (error) {
    return { unreadable: { path, reason: error.message } };
  }
};

const recordedCwd = (lines) => {
  for (const line of lines) {
    if (!line.includes('"cwd"')) continue;
    const cwd = parseEntry(line)?.cwd;
    if (typeof cwd === 'string') {
      return cwd;
    }
  }
  return undefined;
};

const unattributed = ({ path, records }) =>
  records.some((line) => mightHoldInvocation(line))
    ? {
        path,
        reason:
          'it records a tool call but no record in it names the directory the session ran in, so that call can be neither counted for this repository nor ruled out of it',
      }
    : undefined;

const invocationsIn = ({ path, records, roots }) => {
  const entries = records
    .filter((line) => mightHoldInvocation(line))
    .map((line) => parseEntry(line));
  const unparsed = entries.filter((entry) => entry === undefined).length;
  return {
    inScope: true,
    invocations: entries
      .filter((entry) => entry !== undefined)
      .flatMap((entry) => invocationsInEntry({ entry, roots })),
    unreadable:
      unparsed === 0
        ? undefined
        : {
            path,
            reason: `${unparsed} of its record(s) name a tool call and could not be parsed`,
          },
  };
};

const readTranscriptFile = ({ path, roots }) => {
  const { lines, unreadable } = readLines(path);
  if (unreadable !== undefined) {
    return { inScope: false, invocations: [], unreadable };
  }
  const records = lines.filter((line) => line.length > 0);
  const cwd = recordedCwd(records);
  if (cwd === undefined) {
    return {
      inScope: false,
      invocations: [],
      unreadable: unattributed({ path, records }),
    };
  }
  return isWithinAny({ path: cwd, roots })
    ? invocationsIn({ path, records, roots })
    : { inScope: false, invocations: [] };
};

export const tallyByDay = (invocations) => {
  const tally = { skills: {}, subagents: {} };
  for (const { day, kind, name } of invocations) {
    const perDay = tally[kind][name] ?? {};
    perDay[day] = (perDay[day] ?? 0) + 1;
    tally[kind][name] = perDay;
  }
  return tally;
};

const transcriptsIn = (directory) => {
  try {
    return {
      files: readdirSync(directory)
        .filter((name) => name.endsWith('.jsonl'))
        .map((name) => join(directory, name)),
    };
  } catch (error) {
    return {
      files: [],
      unreadable: { path: directory, reason: error.message },
    };
  }
};

const matchingDirectories = ({ root, workingTrees }) => {
  try {
    return {
      directories: readdirSync(root, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            namesADirectoryUnderAny({
              directoryName: entry.name,
              roots: workingTrees,
            }),
        )
        .map((entry) => join(root, entry.name)),
    };
  } catch (error) {
    return { reason: error.message };
  }
};

const transcriptFilesFor = ({ root, workingTrees }) => {
  const { directories, reason } = matchingDirectories({ root, workingTrees });
  if (directories === undefined) {
    return { reason };
  }
  const listings = directories.map((directory) => transcriptsIn(directory));
  return {
    files: listings.flatMap((listing) => listing.files),
    unreadable: listings
      .map((listing) => listing.unreadable)
      .filter((entry) => entry !== undefined),
  };
};

const unreadableReason = ({ root, unreadable }) =>
  unreadable.length === 0
    ? `no transcript under ${root} records a working tree of this repository as its directory`
    : `no readable transcript under ${root} records a working tree of this repository as its directory, and ${unreadable.length} path(s) could not be read`;

export const transcriptRead = ({
  files = 0,
  readFrom,
  reason,
  skipped = [],
  tally = {},
}) => ({
  available: files > 0,
  complete: files > 0 && skipped.length === 0,
  files,
  readFrom,
  reason,
  tally,
  unreadable: skipped,
});

export const readTranscriptUsage = ({ root, since, workingTrees }) => {
  if (!existsSync(root)) {
    return transcriptRead({
      readFrom: since,
      reason: `no transcript directory at ${root} — Claude Code has not run here, or transcripts live elsewhere`,
    });
  }
  const listed = transcriptFilesFor({ root, workingTrees });
  if (listed.files === undefined) {
    return transcriptRead({
      readFrom: since,
      reason: `the transcript directory ${root} could not be listed — ${listed.reason}`,
    });
  }
  const reads = listed.files.map((path) =>
    readTranscriptFile({ path, roots: workingTrees }),
  );
  const skipped = [
    ...listed.unreadable,
    ...reads.map((read) => read.unreadable).filter((e) => e !== undefined),
  ];
  const inScope = reads.filter((read) => read.inScope);
  if (inScope.length === 0) {
    return transcriptRead({
      readFrom: since,
      reason: unreadableReason({ root, unreadable: skipped }),
      skipped,
    });
  }
  const invocations = inScope
    .flatMap((read) => read.invocations)
    .filter((invocation) => since === undefined || invocation.day >= since);
  return transcriptRead({
    files: inScope.length,
    readFrom: since,
    skipped,
    tally: tallyByDay(invocations),
  });
};
