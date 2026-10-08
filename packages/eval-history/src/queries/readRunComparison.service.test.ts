import { describe, expect, it } from 'vite-plus/test';

import { readRunComparison } from './readRunComparison.service.ts';
import { recordingClient } from './recordingClient.util.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const ONLY_IN_B = `{
  "agentPromptHashA": null,
  "agentPromptHashB": null,
  "contentHashA": null,
  "contentHashB": "${'c'.repeat(64)}",
  "expectedHashA": null,
  "expectedHashB": null,
  "fixtureHashA": null,
  "fixtureHashB": "${'f'.repeat(64)}",
  "judgePromptHashA": null,
  "judgePromptHashB": null,
  "kA": null,
  "kB": 1,
  "nA": null,
  "nB": 2,
  "outcomesA": null,
  "outcomesB": ["pass", "fail", "error"],
  "subjectKind": "skill",
  "subjectName": "react-19",
  "suite": "skills",
  "taskHashA": null,
  "taskHashB": "${'t'.repeat(64)}",
  "taskKey": "skills/react-19/trigger-1"
}`;

const onlyInB: Record<string, unknown> = JSON.parse(ONLY_IN_B);

describe('readRunComparison', () => {
  it('returns a task present in one run only, with the other side null', async () => {
    const { client, sent } = recordingClient([onlyInB]);

    expect(await readRunComparison({ a: RUN_A, b: RUN_B, client })).toEqual([
      onlyInB,
    ]);
    expect(sent).toEqual([runCompareQuery({ a: RUN_A, b: RUN_B })]);
  });

  it('rejects an outcome the schema does not name', async () => {
    const { client } = recordingClient([{ ...onlyInB, outcomesB: ['maybe'] }]);

    await expect(
      readRunComparison({ a: RUN_A, b: RUN_B, client }),
    ).rejects.toThrow();
  });
});
