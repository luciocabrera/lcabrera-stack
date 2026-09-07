/**
 * This repository's tsconfig generation run: hand the local entry table to the
 * published writer.
 *
 * The factories and the writer are installed, not vendored; what lives here is
 * the roster, which is this repository's own and no consumer's.
 */
import { writeTsConfigs } from '@lcabrera/tsconfig/generate';

import { configs } from './tsconfig.entries.ts';

await writeTsConfigs({ entries: configs });
