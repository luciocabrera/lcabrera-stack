export const isEvalsDashboardEnabled = (env: NodeJS.ProcessEnv = process.env) =>
  env.EVALS_DASHBOARD === '1';

export const requireEvalsDashboard = (env: NodeJS.ProcessEnv = process.env) => {
  if (!isEvalsDashboardEnabled(env)) {
    throw new Response('Not Found', { status: 404 });
  }
};
