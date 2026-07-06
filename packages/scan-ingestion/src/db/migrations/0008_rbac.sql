-- RBAC foundation (ADR-017): users, roles, permissions (action × resource
-- type), role_permissions, user_roles, and per-instance resource_grants.
-- Enforcement is deny-by-default via cqms.fn_assert_permission, which every
-- write/execute function gains in migration 0009 (ADR-018). All objects are
-- schema-qualified under cqms, per this package's convention.
--
-- Audit-depth convention (confirmed decision): mutable entities carry the
-- full audit set (created_by/created_at/edited_by/edited_at/enabled/
-- deleted_at); pure junction rows (role_permissions, user_roles) are lean
-- (created_by/created_at) — they are added and removed, never edited.

CREATE TABLE cqms.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text NOT NULL UNIQUE,
  display_name   text NOT NULL,
  -- '<saltHex>:<hashHex>' (scrypt, packages/scan-ingestion/src/auth/).
  -- A value that does not match that shape (e.g. the system user's
  -- sentinel) can never verify — a deliberate non-loginable state.
  password_hash  text NOT NULL,
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  edited_by      uuid REFERENCES cqms.users(id),
  edited_at      timestamptz,
  enabled        boolean NOT NULL DEFAULT true,
  deleted_at     timestamptz
);

CREATE TABLE cqms.roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name    text NOT NULL UNIQUE,
  description  text,
  created_by   uuid REFERENCES cqms.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  edited_by    uuid REFERENCES cqms.users(id),
  edited_at    timestamptz,
  enabled      boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz
);

-- Reference table of the full action × resource-type matrix. Adding a new
-- resource type is a data insert plus (if needed) widening the CHECKs —
-- same philosophy as cqms.scanners (0001).
CREATE TABLE cqms.permissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action         text NOT NULL CHECK (action IN ('create','read','update','delete','execute')),
  resource_type  text NOT NULL CHECK (resource_type IN ('project','run','scan','scanner','user','role','workspace')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (action, resource_type)
);

CREATE TABLE cqms.role_permissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id        uuid NOT NULL REFERENCES cqms.roles(id) ON DELETE CASCADE,
  permission_id  uuid NOT NULL REFERENCES cqms.permissions(id) ON DELETE CASCADE,
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE cqms.user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES cqms.users(id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES cqms.roles(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES cqms.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- Per-instance grants: a narrow allow on ONE resource row (e.g. execute
-- scans only on project X), granted to either a user or a role.
CREATE TABLE cqms.resource_grants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grantee_user_id  uuid REFERENCES cqms.users(id) ON DELETE CASCADE,
  grantee_role_id  uuid REFERENCES cqms.roles(id) ON DELETE CASCADE,
  action           text NOT NULL CHECK (action IN ('create','read','update','delete','execute')),
  resource_type    text NOT NULL CHECK (resource_type IN ('project','run','scan','scanner','user','role','workspace')),
  resource_id      uuid NOT NULL,
  created_by       uuid REFERENCES cqms.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  edited_by        uuid REFERENCES cqms.users(id),
  edited_at        timestamptz,
  enabled          boolean NOT NULL DEFAULT true,
  deleted_at       timestamptz,
  CONSTRAINT resource_grants_one_grantee CHECK (
    (grantee_user_id IS NULL) <> (grantee_role_id IS NULL)
  )
);
CREATE INDEX resource_grants_user_idx ON cqms.resource_grants (grantee_user_id, resource_type, action);
CREATE INDEX resource_grants_role_idx ON cqms.resource_grants (grantee_role_id, resource_type, action);
CREATE INDEX resource_grants_resource_idx ON cqms.resource_grants (resource_type, resource_id);

-- All normal user reads go through this view — password_hash never leaves
-- the users table except via fn_get_user_credentials (login only).
CREATE VIEW cqms.v_users AS
  SELECT id, username, display_name, enabled,
         created_by, created_at, edited_by, edited_at
  FROM cqms.users
  WHERE deleted_at IS NULL;

-- The ONLY read path that returns password_hash. Disabled/deleted users
-- return no row, so authentication fails before any hash comparison.
CREATE FUNCTION cqms.fn_get_user_credentials(p_username text)
RETURNS TABLE (id uuid, username text, display_name text, password_hash text) AS $$
  SELECT u.id, u.username, u.display_name, u.password_hash
  FROM cqms.users u
  WHERE u.username = p_username AND u.enabled AND u.deleted_at IS NULL;
$$ LANGUAGE sql;

-- Deny-by-default permission gate. Role permission = type-wide allow;
-- resource grant = narrow allow on one row (checked only when the caller
-- names a resource). Raises 42501 (insufficient_privilege) with a
-- human-readable reason the TS layer surfaces to the UI as-is.
CREATE FUNCTION cqms.fn_assert_permission(
  p_user_id uuid, p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_username text;
  v_enabled boolean;
  v_deleted_at timestamptz;
  v_allowed boolean;
BEGIN
  SELECT u.username, u.enabled, u.deleted_at
  INTO v_username, v_enabled, v_deleted_at
  FROM cqms.users u WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permission denied: unknown user.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT v_enabled OR v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Permission denied: user "%" is disabled.', v_username
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM cqms.user_roles ur
    JOIN cqms.roles r ON r.id = ur.role_id
    JOIN cqms.role_permissions rp ON rp.role_id = ur.role_id
    JOIN cqms.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.action = p_action
      AND p.resource_type = p_resource_type
      AND r.enabled AND r.deleted_at IS NULL
  ) INTO v_allowed;

  IF NOT v_allowed AND p_resource_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM cqms.resource_grants g
      WHERE g.action = p_action
        AND g.resource_type = p_resource_type
        AND g.resource_id = p_resource_id
        AND g.enabled AND g.deleted_at IS NULL
        AND (
          g.grantee_user_id = p_user_id
          OR g.grantee_role_id IN (
            SELECT ur.role_id FROM cqms.user_roles ur WHERE ur.user_id = p_user_id
          )
        )
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Permission denied: user "%" lacks % permission on %.',
      v_username, p_action, p_resource_type
      USING ERRCODE = '42501';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── Seeds ────────────────────────────────────────────────────────────────

-- Full action × resource-type matrix.
INSERT INTO cqms.permissions (action, resource_type)
SELECT a.action, rt.resource_type
FROM unnest(ARRAY['create','read','update','delete','execute']) AS a(action)
CROSS JOIN unnest(ARRAY['project','run','scan','scanner','user','role','workspace']) AS rt(resource_type)
ON CONFLICT (action, resource_type) DO NOTHING;

INSERT INTO cqms.roles (role_name, description) VALUES
  ('admin',     'Full access to everything, including user and role management.'),
  ('developer', 'Create/read/update/delete/execute on projects, runs, scans and workspaces; read-only on scanners.'),
  ('viewer',    'Read-only access to projects, runs, scans, scanners and workspaces.')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO cqms.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM cqms.roles r JOIN cqms.permissions p ON true
WHERE r.role_name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO cqms.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM cqms.roles r
JOIN cqms.permissions p ON (
  p.resource_type IN ('project','run','scan','workspace')
  OR (p.resource_type = 'scanner' AND p.action = 'read')
)
WHERE r.role_name = 'developer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO cqms.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM cqms.roles r
JOIN cqms.permissions p ON (
  p.action = 'read'
  AND p.resource_type IN ('project','run','scan','scanner','workspace')
)
WHERE r.role_name = 'viewer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seeded accounts:
--  * admin — default password 'admin' (scrypt hash generated by
--    src/auth/hashPassword.util.ts). CHANGE IT after first login; this is
--    an internal tool but the default is still flagged in ADR-017.
--  * system — the scan-orchestrator's actor identity for audit fields and
--    permission checks (migration 0009). Its password_hash is a sentinel
--    that isPasswordValid can never accept, so it cannot log in.
INSERT INTO cqms.users (username, display_name, password_hash) VALUES
  ('admin',  'Administrator', '9be165df1e47567c54a1e11efe15738e:af5de6589fd4b533976341745bd2df4be38a2237ccf4d1a1b57f9e5ea7ea9927a427221322cca0ab0d3574b0696b8d968070326842db1ea2f3eef2ac1940e163'),
  ('system', 'System (scan-orchestrator)', '!no-login!')
ON CONFLICT (username) DO NOTHING;

INSERT INTO cqms.user_roles (user_id, role_id)
SELECT u.id, r.id FROM cqms.users u JOIN cqms.roles r ON r.role_name = 'admin'
WHERE u.username IN ('admin', 'system')
ON CONFLICT (user_id, role_id) DO NOTHING;
