-- ADR-029 (CodePulse Phase 1 remainder): per-user revocable API tokens.
-- The CLI push channel (PRD_V2 §3) authenticates with tokens a user issues
-- from their profile page and can revoke at will (PRD_V2 §12/§14.3). A token
-- is split into a public lookup half (token_id) and a secret half; only the
-- secret's scrypt hash is stored, mirroring how cqms.users stores password
-- hashes (ADR-017) — the hash is returned by exactly one function
-- (fn_get_api_token_secret), consumed only inside verifyApiToken, and never
-- surfaced by a view.

-- ── A. Token table ─────────────────────────────────────────────────────────
-- An entity table (full audit set); "revocable" = soft-delete via deleted_at
-- (+ enabled), the same never-hard-delete model as users/roles/grants.
-- uuidv7() PK per the 0027 convention (PG-18 core).
CREATE TABLE cqms.api_tokens (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id      uuid NOT NULL REFERENCES cqms.users(id) ON DELETE CASCADE,
  token_id     varchar(32) NOT NULL UNIQUE,  -- public lookup half (16 hex chars, headroom)
  token_hash   varchar(255) NOT NULL,        -- scrypt <saltHex>:<hashHex> (161 chars); never exposed
  name         varchar(100) NOT NULL,        -- user-facing label
  last_used_at timestamptz,                   -- touched on each successful verify
  expires_at   timestamptz,                  -- NULL = never expires
  created_by   uuid REFERENCES cqms.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  edited_by    uuid REFERENCES cqms.users(id),
  edited_at    timestamptz,
  enabled      boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz
);

CREATE INDEX idx_api_tokens_user
  ON cqms.api_tokens (user_id, created_at DESC);

-- ── B. Read view (never exposes token_hash) ────────────────────────────────
-- The token-management UI reads this; the secret hash stays out of the
-- read layer entirely, exactly as v_users omits password_hash.
CREATE VIEW cqms.v_api_tokens AS
  SELECT id, user_id, token_id, name, last_used_at, expires_at,
         created_at, created_by, edited_at, edited_by, enabled
  FROM cqms.api_tokens
  WHERE deleted_at IS NULL;

-- ── C. Functions ───────────────────────────────────────────────────────────

-- Self-service issuance: a logged-in user mints tokens for their OWN account
-- with no role permission (the fn_set_user_password model). The actor must
-- be enabled; the token is always owned by the actor.
CREATE FUNCTION cqms.fn_issue_api_token(
  p_user_id uuid, p_token_id text, p_token_hash text,
  p_name text, p_expires_at timestamptz
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cqms.users
    WHERE id = p_user_id AND enabled AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permission denied: user is disabled.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO cqms.api_tokens
    (user_id, token_id, token_hash, name, expires_at, created_by)
  VALUES
    (p_user_id, p_token_id, p_token_hash, p_name, p_expires_at, p_user_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- The token IS the identity being verified, so there is no permission check
-- here — this is the fn_get_user_credentials analogue. Returns the stored
-- hash for verifyApiToken to compare, and no row at all when the token is
-- revoked/expired or its owner is disabled/deleted (fail before compare).
CREATE FUNCTION cqms.fn_get_api_token_secret(p_token_id text)
RETURNS TABLE (user_id uuid, token_hash text) LANGUAGE plpgsql AS $$
BEGIN
  -- ::text so the RETURN QUERY tuple matches the text return type despite
  -- token_hash being varchar(255) on the table (plpgsql checks this strictly).
  RETURN QUERY
  SELECT t.user_id, t.token_hash::text
  FROM cqms.api_tokens t
  JOIN cqms.users u ON u.id = t.user_id
  WHERE t.token_id = p_token_id
    AND t.enabled
    AND t.deleted_at IS NULL
    AND (t.expires_at IS NULL OR t.expires_at > now())
    AND u.enabled
    AND u.deleted_at IS NULL;
END;
$$;

-- Records last use after a successful verify (best-effort observability).
CREATE FUNCTION cqms.fn_touch_api_token(p_token_id text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE cqms.api_tokens SET last_used_at = now()
  WHERE token_id = p_token_id AND deleted_at IS NULL;
END;
$$;

-- Revoke = soft-delete. Owner may revoke their own; revoking someone else's
-- requires 'update' on that user (the ADR-024 admin-over-user model).
CREATE FUNCTION cqms.fn_revoke_api_token(p_user_id uuid, p_token_id text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM cqms.api_tokens
  WHERE token_id = p_token_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found.';
  END IF;

  IF p_user_id <> v_owner THEN
    PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'user', v_owner);
  ELSIF NOT EXISTS (
    SELECT 1 FROM cqms.users
    WHERE id = p_user_id AND enabled AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permission denied: user is disabled.' USING ERRCODE = '42501';
  END IF;

  UPDATE cqms.api_tokens SET
    deleted_at = now(),
    enabled    = false,
    edited_by  = p_user_id,
    edited_at  = now()
  WHERE token_id = p_token_id;
END;
$$;
