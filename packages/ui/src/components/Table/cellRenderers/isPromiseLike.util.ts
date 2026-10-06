import { isObject } from '@lcabrera/utils/guards/is-object.util';

export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  isObject(value) && typeof value.then === 'function';
