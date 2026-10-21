exports.up = (pgm) => {
  pgm.sql(`
 CREATE TABLE paradox.users (id uuid PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE paradox.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES paradox.users(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL, renewed_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, absolute_expires_at timestamptz NOT NULL);
 CREATE INDEX sessions_user ON paradox.sessions(user_id);
 CREATE TABLE paradox.login_limits (key text PRIMARY KEY, attempts integer NOT NULL, reset_at timestamptz NOT NULL);
 CREATE TABLE paradox.user_matches (user_id uuid PRIMARY KEY REFERENCES paradox.users(id) ON DELETE CASCADE, state jsonb NOT NULL, revision integer NOT NULL DEFAULT 0, session_id uuid REFERENCES paradox.sessions(id) ON DELETE SET NULL, tab_id uuid, control_version integer NOT NULL DEFAULT 0, lease_expires_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE paradox.action_receipts (user_id uuid NOT NULL REFERENCES paradox.users(id) ON DELETE CASCADE, request_id uuid NOT NULL, fingerprint text NOT NULL, response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,request_id));
 `);
};
exports.down = (pgm) => {
  pgm.sql(
    `DROP TABLE paradox.action_receipts, paradox.user_matches, paradox.login_limits, paradox.sessions, paradox.users;`,
  );
};
