import type { LogLevel, LogLevelPriority } from './logger.types';

export const LOG_LEVEL_PRIORITY: LogLevelPriority = {
  debug: 4,
  error: 1,
  info: 3,
  silent: 0,
  warn: 2,
} as const;

export const DEFAULT_LOG_LEVEL: LogLevel = import.meta.env.DEV
  ? 'info'
  : 'error';
