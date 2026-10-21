exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE paradox.users
      ALTER COLUMN id SET DEFAULT gen_random_uuid(),
      ALTER COLUMN email TYPE varchar(254),
      ALTER COLUMN password_hash TYPE varchar(60),
      ADD COLUMN name varchar(255) NOT NULL DEFAULT 'Player',
      ADD COLUMN username varchar(30) NOT NULL DEFAULT ('player_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 23)),
      ADD COLUMN updated_at timestamptz,
      ADD COLUMN is_admin boolean NOT NULL DEFAULT false,
      ADD COLUMN email_verification_required boolean NOT NULL DEFAULT false,
      ADD COLUMN email_verified_at timestamptz,
      ADD COLUMN email_verification_version integer NOT NULL DEFAULT 0;
    UPDATE paradox.users SET updated_at = created_at;
    ALTER TABLE paradox.users
      ALTER COLUMN updated_at SET DEFAULT now(),
      ALTER COLUMN updated_at SET NOT NULL,
      ALTER COLUMN email_verification_required SET DEFAULT true,
      ADD CONSTRAINT users_name_not_blank CHECK (length(btrim(name)) > 0),
      ADD CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_.-]{1,30}$'),
      ADD CONSTRAINT users_email_verification_version_nonnegative CHECK (email_verification_version >= 0);
    CREATE UNIQUE INDEX users_username_case_insensitive ON paradox.users(lower(username));
    CREATE UNIQUE INDEX users_email_case_insensitive ON paradox.users(lower(email));
    CREATE FUNCTION paradox.update_user_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.updated_at := now();
      IF lower(NEW.email) IS DISTINCT FROM lower(OLD.email) THEN
        NEW.email_verified_at := NULL;
        NEW.email_verification_required := true;
        NEW.email_verification_version := OLD.email_verification_version + 1;
      END IF;
      RETURN NEW;
    END;
    $$;
    CREATE TRIGGER users_update_metadata BEFORE UPDATE ON paradox.users
      FOR EACH ROW EXECUTE FUNCTION paradox.update_user_metadata();
  `);
};
exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER users_update_metadata ON paradox.users;
    DROP FUNCTION paradox.update_user_metadata();
    DROP INDEX paradox.users_username_case_insensitive;
    DROP INDEX paradox.users_email_case_insensitive;
    ALTER TABLE paradox.users
      DROP CONSTRAINT users_name_not_blank,
      DROP CONSTRAINT users_username_format,
      DROP CONSTRAINT users_email_verification_version_nonnegative,
      DROP COLUMN name, DROP COLUMN username, DROP COLUMN updated_at,
      DROP COLUMN is_admin, DROP COLUMN email_verification_required,
      DROP COLUMN email_verified_at, DROP COLUMN email_verification_version,
      ALTER COLUMN id DROP DEFAULT,
      ALTER COLUMN email TYPE text,
      ALTER COLUMN password_hash TYPE text;
  `);
};
