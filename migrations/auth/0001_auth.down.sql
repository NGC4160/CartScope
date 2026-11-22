-- Manual rollback for migrations/auth/0001_auth.sql.
-- scripts/migrate.mjs and the PGLite boot do not run this file. `.down.sql`
-- is not a forward migration. Running it by hand deletes every sign-in user,
-- session, account, and verification row. Applying 0001_auth.sql again
-- recreates empty tables. It does not put those rows back.

drop index if exists "verification_identifier_idx";
drop index if exists "account_userId_idx";
drop index if exists "session_userId_idx";

drop table if exists "verification";
drop table if exists "account";
drop table if exists "session";
drop table if exists "user";
