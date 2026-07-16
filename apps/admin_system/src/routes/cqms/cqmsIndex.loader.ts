import { redirect } from 'react-router';

/** `/cqms` itself is just a redirect to the real project list at `/cqms/projects`. */
export const loader = () => redirect('/cqms/projects');
