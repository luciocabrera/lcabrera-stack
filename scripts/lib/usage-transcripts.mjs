/**
 * Counts Skill and subagent invocations out of the Claude Code transcripts on
 * this machine, per day, for the working trees of this repository.
 *
 * Transcripts are the only store that records an invocation at all — a skill
 * leaves no other trace — so this is the source for the two harness parts that
 * are called by name. It is also the only expiring one, which is why the caller
 * merges it with a local snapshot rather than reading it alone.
 *
 * The reader reports whether it could read, separately from what it found: a
 * missing transcript directory and a repository nobody has used produce the same
 * empty tally, and those are opposite conclusions.
 *
 * `since` is optional and is meant to stay that way. Dropping an invocation that
 * is still on disk can only shrink a count the report will then label with a
 * wider window, so the bound exists for a run that is deliberately simulating
 * expiry and for nothing else.
 *
 * Discovery walks every directory under the transcript root and keeps the ones
 * whose name is a working tree's, or descends from one. Claude Code files a
 * transcript under the directory the session was launched from, so a session
 * started in a package or an app is filed under that path, never under the tree
 * root — naming the roots alone would silently drop every one of those.
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

const invocationsInFile = ({ path, roots }) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0 && mightHoldInvocation(line))
    .map((line) => parseEntry(line))
    .filter((entry) => entry !== undefined)
    .flatMap((entry) => invocationsInEntry({ entry, roots }));

export const tallyByDay = (invocations) => {
  const tally = { skills: {}, subagents: {} };
  for (const { day, kind, name } of invocations) {
    const perDay = tally[kind][name] ?? {};
    perDay[day] = (perDay[day] ?? 0) + 1;
    tally[kind][name] = perDay;
  }
  return tally;
};

const transcriptFilesFor = ({ root, workingTrees }) =>
  readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        namesADirectoryUnderAny({
          directoryName: entry.name,
          roots: workingTrees,
        }),
    )
    .map((entry) => join(root, entry.name))
    .flatMap((directory) =>
      readdirSync(directory)
        .filter((name) => name.endsWith('.jsonl'))
        .map((name) => join(directory, name)),
    );

export const readTranscriptUsage = ({ root, since, workingTrees }) => {
  if (!existsSync(root)) {
    return {
      available: false,
      reason: `no transcript directory at ${root} — Claude Code has not run here, or transcripts live elsewhere`,
      tally: {},
    };
  }
  const files = transcriptFilesFor({ root, workingTrees });
  if (files.length === 0) {
    return {
      available: false,
      reason: `no transcript file under ${root} matches a working tree of this repository`,
      tally: {},
    };
  }
  const invocations = files
    .flatMap((path) => invocationsInFile({ path, roots: workingTrees }))
    .filter((invocation) => since === undefined || invocation.day >= since);
  return {
    available: true,
    files: files.length,
    tally: tallyByDay(invocations),
  };
};
