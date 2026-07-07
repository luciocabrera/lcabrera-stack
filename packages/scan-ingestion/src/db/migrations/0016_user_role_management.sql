-- User/role management (ADR-024, Phase-3 Step 10). The RBAC tables (0008)
-- gain their management surface: read views + p_user_id-first write
-- functions the /cqms/admin UI calls. Deny-by-default stays in
-- fn_assert_permission; these functions add the lockout guards that pure
-- permission checks cannot express (you cannot disable your own account,
-- strip your own admin role, disable/mutate the seeded admin role, or
-- touch the system account's login/roles).

-- ── Read views (ADR-018 rule; none of these existed before) ──────────────

CREATE VIEW cqms.v_roles AS
  SELECT * FROM cqms.roles WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_permissions AS
  SELECT * FROM cqms.permissions;

CREATE VIEW cqms.v_user_roles AS
  SELECT * FROM cqms.user_roles;

CREATE VIEW cqms.v_role_permissions AS
  SELECT * FROM cqms.role_permissions;

CREATE VIEW cqms.v_resource_grants AS
  SELECT * FROM cqms.resource_grants WHERE deleted_at IS NULL;

-- ── Users ─────────────────────────────────────────────────────────────────

CREATE FUNCTION cqms.fn_create_user(
  p_user_id uuid, p_username text, p_display_name text, p_password_hash text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'user');

  IF p_username IS NULL OR p_username !~ '^[a-z0-9][a-z0-9._-]{1,63}$' THEN
    RAISE EXCEPTION 'Username must be lowercase alphanumeric (dots, dashes, underscores allowed), 2-64 chars.';
  END IF;
  IF EXISTS (SELECT 1 FROM cqms.users WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username "%" already exists.', p_username;
  END IF;

  INSERT INTO cqms.users (username, display_name, password_hash, created_by)
  VALUES (p_username, p_display_name, p_password_hash, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE FUNCTION cqms.fn_update_user(
  p_user_id uuid, p_target_user_id uuid, p_display_name text, p_enabled boolean
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_target cqms.users;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'user', p_target_user_id);

  SELECT * INTO v_target FROM cqms.users
  WHERE id = p_target_user_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  IF p_enabled = false AND v_target.id = p_user_id THEN
    RAISE EXCEPTION 'You cannot disable your own account.';
  END IF;
  IF p_enabled = false AND v_target.username = 'system' THEN
    RAISE EXCEPTION 'The system account cannot be disabled — the scan-orchestrator acts as it.';
  END IF;

  UPDATE cqms.users SET
    display_name = coalesce(p_display_name, display_name),
    enabled      = coalesce(p_enabled, enabled),
    edited_by    = p_user_id,
    edited_at    = now()
  WHERE id = p_target_user_id;
END;
$$;

-- Self-service password change needs no role permission (any enabled user
-- may change their OWN password — that is how the seeded admin default
-- gets rotated); changing someone else's requires 'update' on 'user'.
CREATE FUNCTION cqms.fn_set_user_password(
  p_user_id uuid, p_target_user_id uuid, p_password_hash text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_username text;
BEGIN
  IF p_user_id <> p_target_user_id THEN
    PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'user', p_target_user_id);
  ELSIF NOT EXISTS (
    SELECT 1 FROM cqms.users
    WHERE id = p_user_id AND enabled AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permission denied: user is disabled.' USING ERRCODE = '42501';
  END IF;

  SELECT username INTO v_username FROM cqms.users
  WHERE id = p_target_user_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
  IF v_username = 'system' THEN
    RAISE EXCEPTION 'The system account is deliberately non-loginable.';
  END IF;

  UPDATE cqms.users SET
    password_hash = p_password_hash,
    edited_by     = p_user_id,
    edited_at     = now()
  WHERE id = p_target_user_id;
END;
$$;

CREATE FUNCTION cqms.fn_replace_user_roles(
  p_user_id uuid, p_target_user_id uuid, p_role_ids jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_target_username text;
  v_requested_count integer;
  v_matched_count integer;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'user', p_target_user_id);

  SELECT username INTO v_target_username FROM cqms.users
  WHERE id = p_target_user_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
  IF v_target_username = 'system' THEN
    RAISE EXCEPTION 'The system account''s roles are fixed.';
  END IF;

  SELECT count(*) INTO v_requested_count FROM jsonb_array_elements_text(p_role_ids);
  SELECT count(*) INTO v_matched_count
  FROM jsonb_array_elements_text(p_role_ids) AS e(value)
  JOIN cqms.roles r ON r.id = e.value::uuid AND r.deleted_at IS NULL;
  IF v_matched_count <> v_requested_count THEN
    RAISE EXCEPTION 'Unknown role id in the requested set.';
  END IF;

  -- Lockout guard: an admin editing THEMSELF cannot drop the admin role.
  IF p_target_user_id = p_user_id
     AND EXISTS (
       SELECT 1 FROM cqms.user_roles ur
       JOIN cqms.roles r ON r.id = ur.role_id
       WHERE ur.user_id = p_user_id AND r.role_name = 'admin'
     )
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(p_role_ids) AS e(value)
       JOIN cqms.roles r ON r.id = e.value::uuid
       WHERE r.role_name = 'admin'
     ) THEN
    RAISE EXCEPTION 'You cannot remove your own admin role.';
  END IF;

  DELETE FROM cqms.user_roles WHERE user_id = p_target_user_id;
  INSERT INTO cqms.user_roles (user_id, role_id, created_by)
  SELECT p_target_user_id, e.value::uuid, p_user_id
  FROM jsonb_array_elements_text(p_role_ids) AS e(value);
END;
$$;

-- ── Roles ─────────────────────────────────────────────────────────────────

CREATE FUNCTION cqms.fn_create_role(
  p_user_id uuid, p_role_name text, p_description text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'role');

  IF p_role_name IS NULL OR p_role_name !~ '^[a-z0-9][a-z0-9-]{1,63}$' THEN
    RAISE EXCEPTION 'Role name must be lowercase kebab-case, 2-64 chars.';
  END IF;
  IF EXISTS (SELECT 1 FROM cqms.roles WHERE role_name = p_role_name) THEN
    RAISE EXCEPTION 'Role "%" already exists.', p_role_name;
  END IF;

  INSERT INTO cqms.roles (role_name, description, created_by)
  VALUES (p_role_name, p_description, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- role_name is immutable (a natural key the lockout guards reference);
-- the seeded admin role can never be disabled.
CREATE FUNCTION cqms.fn_update_role(
  p_user_id uuid, p_role_id uuid, p_description text, p_enabled boolean
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_role_name text;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'role', p_role_id);

  SELECT role_name INTO v_role_name FROM cqms.roles
  WHERE id = p_role_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found.';
  END IF;
  IF v_role_name = 'admin' AND p_enabled = false THEN
    RAISE EXCEPTION 'The admin role cannot be disabled.';
  END IF;

  UPDATE cqms.roles SET
    description = coalesce(p_description, description),
    enabled     = coalesce(p_enabled, enabled),
    edited_by   = p_user_id,
    edited_at   = now()
  WHERE id = p_role_id;
END;
$$;

CREATE FUNCTION cqms.fn_replace_role_permissions(
  p_user_id uuid, p_role_id uuid, p_permission_ids jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_role_name text;
  v_requested_count integer;
  v_matched_count integer;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'role', p_role_id);

  SELECT role_name INTO v_role_name FROM cqms.roles
  WHERE id = p_role_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found.';
  END IF;
  IF v_role_name = 'admin' THEN
    RAISE EXCEPTION 'The admin role''s permissions are fixed (global lockout guard).';
  END IF;

  SELECT count(*) INTO v_requested_count FROM jsonb_array_elements_text(p_permission_ids);
  SELECT count(*) INTO v_matched_count
  FROM jsonb_array_elements_text(p_permission_ids) AS e(value)
  JOIN cqms.permissions p ON p.id = e.value::uuid;
  IF v_matched_count <> v_requested_count THEN
    RAISE EXCEPTION 'Unknown permission id in the requested set.';
  END IF;

  DELETE FROM cqms.role_permissions WHERE role_id = p_role_id;
  INSERT INTO cqms.role_permissions (role_id, permission_id, created_by)
  SELECT p_role_id, e.value::uuid, p_user_id
  FROM jsonb_array_elements_text(p_permission_ids) AS e(value);
END;
$$;

-- ── Per-instance grants (the project-detail editor) ──────────────────────
-- Managing a grant requires 'update' on the grant's resource TYPE (with the
-- resource named, so a per-instance update grant would qualify too). The
-- "execute scans on project Y" grant is (action='execute',
-- resource_type='scan', resource_id=<project uuid>) — exactly the tuple
-- fn_create_run asserts (0009).

CREATE FUNCTION cqms.fn_create_resource_grant(
  p_user_id uuid, p_grantee_user_id uuid, p_action text,
  p_resource_type text, p_resource_id uuid
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', p_resource_type, p_resource_id);

  IF NOT EXISTS (
    SELECT 1 FROM cqms.users
    WHERE id = p_grantee_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Grantee user not found.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cqms.resource_grants
    WHERE grantee_user_id = p_grantee_user_id AND action = p_action
      AND resource_type = p_resource_type AND resource_id = p_resource_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'This grant already exists.';
  END IF;

  INSERT INTO cqms.resource_grants
    (grantee_user_id, action, resource_type, resource_id, created_by)
  VALUES (p_grantee_user_id, p_action, p_resource_type, p_resource_id, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE FUNCTION cqms.fn_delete_resource_grant(
  p_user_id uuid, p_grant_id uuid
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_grant cqms.resource_grants;
BEGIN
  SELECT * INTO v_grant FROM cqms.resource_grants
  WHERE id = p_grant_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grant not found.';
  END IF;

  PERFORM cqms.fn_assert_permission(p_user_id, 'update', v_grant.resource_type, v_grant.resource_id);

  UPDATE cqms.resource_grants SET
    enabled    = false,
    deleted_at = now(),
    edited_by  = p_user_id,
    edited_at  = now()
  WHERE id = p_grant_id;
END;
$$;
