import { describe, expect, it } from 'vite-plus/test';

import { readQualityScores } from './readQualityScores.service.ts';
import { readRunHealth } from './readRunHealth.service.ts';
import { readTaskTrials } from './readTaskTrials.service.ts';
import { readTriggerConfusion } from './readTriggerConfusion.service.ts';
import { scriptedClient } from './scriptedClient.util.ts';

describe('the readers scoped to a set of runs', () => {
  it.each([
    { name: 'readQualityScores', read: readQualityScores },
    { name: 'readRunHealth', read: readRunHealth },
    { name: 'readTaskTrials', read: readTaskTrials },
    { name: 'readTriggerConfusion', read: readTriggerConfusion },
  ])('$name asks nothing for no runs', async ({ read }) => {
    const { client, sent } = scriptedClient({ answer: () => [], columns: [] });

    expect(await read({ client, runIds: [] })).toEqual([]);
    expect(sent).toEqual([]);
  });
});
