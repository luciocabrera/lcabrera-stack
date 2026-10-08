export const requireEvalsDashboard = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.EVALS_DASHBOARD !== '1') {
    throw new Response('Not Found', { status: 404 });
  }
};
