import type { HookInput } from '@anthropic-ai/claude-agent-sdk';

import { describe, expect, it } from 'vite-plus/test';

import { secretFileGuardHook } from './secretFileGuardHook.util.ts';

type MakePreToolUseInputArgs = {
  readonly toolInput: unknown;
  readonly toolName: string;
};

const makePreToolUseInput = ({
  toolInput,
  toolName,
}: MakePreToolUseInputArgs): HookInput => ({
  cwd: '/tmp/target',
  hook_event_name: 'PreToolUse',
  session_id: 'session-1',
  tool_input: toolInput,
  tool_name: toolName,
  tool_use_id: 'tool-use-1',
  transcript_path: '/tmp/transcript.jsonl',
});

const callHook = async (input: HookInput) =>
  secretFileGuardHook(input, 'tool-use-1', {
    signal: new AbortController().signal,
  });

describe('secretFileGuardHook', () => {
  it('denies a Read of a secret file with the PreToolUse deny shape', async () => {
    const output = await callHook(
      makePreToolUseInput({
        toolInput: { file_path: '/target/docker/local/.env' },
        toolName: 'Read',
      }),
    );

    expect(output).toMatchObject({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
      },
    });
    const hookSpecificOutput =
      'hookSpecificOutput' in output ? output.hookSpecificOutput : undefined;
    const reason =
      hookSpecificOutput?.hookEventName === 'PreToolUse'
        ? hookSpecificOutput.permissionDecisionReason
        : undefined;
    expect(reason).toContain('/target/docker/local/.env');
  });

  it('denies a Bash command referencing a secret file token', async () => {
    const output = await callHook(
      makePreToolUseInput({
        toolInput: { command: 'cat .env.local' },
        toolName: 'Bash',
      }),
    );

    expect(output).toMatchObject({
      hookSpecificOutput: { permissionDecision: 'deny' },
    });
  });

  it('stays silent for a normal source-file Read', async () => {
    const output = await callHook(
      makePreToolUseInput({
        toolInput: { file_path: '/target/src/app.ts' },
        toolName: 'Read',
      }),
    );

    expect(output).toEqual({});
  });

  it('stays silent for .env.example and for non-PreToolUse events', async () => {
    const exampleOutput = await callHook(
      makePreToolUseInput({
        toolInput: { file_path: '/target/.env.example' },
        toolName: 'Read',
      }),
    );
    expect(exampleOutput).toEqual({});

    const otherEvent = await secretFileGuardHook(
      {
        cwd: '/tmp/target',
        hook_event_name: 'SessionStart',
        session_id: 'session-1',
        source: 'startup',
        transcript_path: '/tmp/transcript.jsonl',
      } as HookInput,
      undefined,
      { signal: new AbortController().signal },
    );
    expect(otherEvent).toEqual({});
  });
});
