/**
 * This repo's tsconfig generation run: hand the local entry table to the
 * published writer.
 *
 * The factories and the writer live in `@lcabrera/tsconfig` (ADR-069); what
 * stays here is `tsconfig.entries.ts`, which is nothing but this repo's own
 * workspace roster. That is the whole reason the split is a split rather than a
 * rename — a consumer installing the package must not receive our roster.
 */
import { writeTsConfigs } from '@lcabrera/tsconfig/generate';

import { configs } from './tsconfig.entries.ts';

await writeTsConfigs({ entries: configs });
