import { Link, Outlet } from 'react-router';

// The admin app has no other chrome — this thin top nav is the only way to
// reach the sibling CQMS sections (and the self-service API Tokens page).
const NAV_LINKS = [
  { label: 'Projects', to: '/cqms/projects' },
  { label: 'Scanners', to: '/cqms/scanners' },
  { label: 'Users', to: '/cqms/admin/users' },
  { label: 'Roles', to: '/cqms/admin/roles' },
  { label: 'LLM Usage', to: '/cqms/admin/llm-usage' },
  { label: 'API Tokens', to: '/cqms/account/tokens' },
] as const;

export const CqmsLayout = () => (
  <>
    <nav>
      {NAV_LINKS.map((link, index) => (
        <span key={link.to}>
          {index > 0 && ' · '}
          <Link to={link.to}>{link.label}</Link>
        </span>
      ))}
    </nav>
    <Outlet />
  </>
);
