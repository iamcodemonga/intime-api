-- Align membership_roles.inspector_id → center_id (idempotent for DBs already renamed).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'membership_roles'
      AND column_name = 'inspector_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'membership_roles'
      AND column_name = 'center_id'
  ) THEN
    ALTER TABLE public.membership_roles RENAME COLUMN inspector_id TO center_id;
  END IF;
END $$;

DROP INDEX IF EXISTS public.membership_roles_profile_role_inspector_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS membership_roles_profile_role_center_uidx
  ON public.membership_roles (
    profile_id,
    role_id,
    (COALESCE(center_id, '00000000-0000-0000-0000-000000000000'::uuid))
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'membership_roles_inspector_id_fkey'
      AND conrelid = 'public.membership_roles'::regclass
  ) THEN
    ALTER TABLE public.membership_roles
      RENAME CONSTRAINT membership_roles_inspector_id_fkey
      TO membership_roles_center_id_fkey;
  END IF;
END $$;
