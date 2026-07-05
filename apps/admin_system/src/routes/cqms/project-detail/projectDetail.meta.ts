import type { Route } from './+types/root';

export const meta = ({ loaderData }: Route.MetaArgs) => [
  { title: `${loaderData?.project.name ?? 'Project'} - CQMS` },
];
