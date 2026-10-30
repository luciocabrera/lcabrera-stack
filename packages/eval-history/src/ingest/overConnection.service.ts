import type { IngestConnection, IngestReport } from './ingest.types.ts';

import { errorReason } from './errorReason.util.ts';
import { inSequence } from './inSequence.service.ts';

type OverConnectionArgs<Item> = {
  readonly connect: () => Promise<IngestConnection>;
  readonly items: readonly Item[];
  readonly step: (args: StepArgs<Item>) => Promise<IngestReport>;
  readonly unsent: (args: UnsentArgs<Item>) => IngestReport;
};

type StepArgs<Item> = {
  readonly connection: IngestConnection;
  readonly item: Item;
};

type UnsentArgs<Item> = {
  readonly item: Item;
  readonly problem: string;
};

const openConnection = async (
  connect: OverConnectionArgs<unknown>['connect'],
) => {
  try {
    return { connection: await connect(), ok: true } as const;
  } catch (error) {
    return { ok: false, reason: errorReason(error) } as const;
  }
};

export const overConnection = async <Item>({
  connect,
  items,
  step,
  unsent,
}: OverConnectionArgs<Item>) => {
  if (items.length === 0) {
    return [];
  }

  const opened = await openConnection(connect);

  if (!opened.ok) {
    return items.map((item) =>
      unsent({ item, problem: `could not connect: ${opened.reason}` }),
    );
  }

  try {
    return await inSequence({
      items,
      step: (item) => step({ connection: opened.connection, item }),
    });
  } finally {
    await opened.connection.end();
  }
};
