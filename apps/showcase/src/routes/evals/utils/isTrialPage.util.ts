import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TrialPage } from '../types/trialTableRow.types';

export const isTrialPage = (value: unknown): value is TrialPage =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.total === 'number';
