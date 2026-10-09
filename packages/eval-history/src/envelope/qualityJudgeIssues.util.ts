import type { EnvelopeShape, TrialDetail } from './envelope.types.ts';

type QualityJudgeIssuesArgs = {
  readonly detail: TrialDetail;
  readonly index: number;
  readonly task: EnvelopeShape['tasks'][number] | undefined;
};

export const qualityJudgeIssues = ({
  detail,
  index,
  task,
}: QualityJudgeIssuesArgs) => {
  if (detail.schema !== 'quality/1') {
    return [];
  }

  return [
    ...(detail.judge_model.trim() === ''
      ? [
          {
            code: 'custom' as const,
            message: 'a quality trial names its judge_model',
            path: ['trials', index, 'detail', 'judge_model'],
          },
        ]
      : []),
    ...(task?.judge_prompt_hash === null
      ? [
          {
            code: 'custom' as const,
            message: `quality task ${task.task_key} carries no judge_prompt_hash`,
            path: ['trials', index, 'task_key'],
          },
        ]
      : []),
  ];
};
