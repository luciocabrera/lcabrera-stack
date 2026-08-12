import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { configs } from './tsconfig.entries.ts';

type WriteConfigArgs = {
  readonly config: unknown;
  readonly filePath: string;
};

const stringifyConfig = (config: unknown): string =>
  `${JSON.stringify(config, null, 2)}\n`;

const writeConfigFile = async ({
  config,
  filePath,
}: WriteConfigArgs): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stringifyConfig(config), 'utf8');
};

await Promise.all(configs.map(writeConfigFile));
