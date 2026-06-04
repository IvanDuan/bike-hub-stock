-- Add superadmin role: all branches, all staff (vs manager = one branch, staff only).
-- Split into two steps because Postgres requires new enum values to commit before use.

alter type public.staff_role add value if not exists 'superadmin';

-- Run policies in 007_superadmin_rls.sql (or apply via dashboard after this file).
