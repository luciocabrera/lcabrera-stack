export const HUMAN_SCORE_RANGE = { max: 5, min: 1 } as const;

export const SCORE_ARGUMENT = /^(?<dimension>[^=\s]+)=(?<score>\S+)$/u;

export const TRIAL_ID = /^[1-9]\d*$/u;
