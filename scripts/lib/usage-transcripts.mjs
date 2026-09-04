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
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { isWithinAny, namesADirectoryUnderAny } from './usage-scope.mjs';
import { dayOf } from './usage-window.mjs';

const SKILL_TOOL = 'Skill';
const SUBAGENT_TOOLS = new Set(['Agent', 'Task']);

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
    return typeof name === 'string' ? { kind: 'subagents', name } : undefined;
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

const invocationsInFile = ({ path, roots }) => {
  const { lines, unreadable } = readLines(path);
  if (unreadable !== undefined) {
    return { invocations: [], unreadable };
  }
  return {
    invocations: lines
      .filter((line) => line.length > 0 && mightHoldInvocation(line))
      .map((line) => parseEntry(line))
      .filter((entry) => entry !== undefined)
      .flatMap((entry) => invocationsInEntry({ entry, roots })),
  };
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

export const readTranscriptUsage = ({ root, since, workingTrees }) => {
  if (!existsSync(root)) {
    return {
      available: false,
      reason: `no transcript directory at ${root} — Claude Code has not run here, or transcripts live elsewhere`,
      tally: {},
    };
  }
  const listed = transcriptFilesFor({ root, workingTrees });
  if (listed.files === undefined) {
    return {
      available: false,
      reason: `the transcript directory ${root} could not be listed — ${listed.reason}`,
      tally: {},
    };
  }
  if (listed.files.length === 0) {
    return {
      available: false,
      reason: `no transcript file under ${root} matches a working tree of this repository`,
      tally: {},
    };
  }
  const reads = listed.files.map((path) =>
    invocationsInFile({ path, roots: workingTrees }),
  );
  const invocations = reads
    .flatMap((read) => read.invocations)
    .filter((invocation) => since === undefined || invocation.day >= since);
  return {
    available: true,
    files: listed.files.length,
    tally: tallyByDay(invocations),
    unreadable: [
      ...listed.unreadable,
      ...reads.map((read) => read.unreadable).filter((e) => e !== undefined),
    ],
  };
};
