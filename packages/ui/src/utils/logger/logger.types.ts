export type CreateLoggerArgs = {
  readonly level?: LogLevel;
  readonly prefix?: string;
};

export type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'warn';

export type LogLevelPriority = Record<LogLevel, number>;
