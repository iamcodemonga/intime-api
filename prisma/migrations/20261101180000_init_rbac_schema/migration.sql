-- Applied via Supabase MCP (init_rbac_schema). Kept for local Prisma history.
-- Prefer applying with: supabase MCP / dashboard when DATABASE_URL is unavailable.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sn integer NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  module text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  phone_number text,
  verified boolean NOT NULL DEFAULT false,
  address text,
  location_area text,
  zone text,
  state text,
  country text NOT NULL DEFAULT 'Nigeria',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.system_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.system_permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.membership_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES public.inspection_centers(id) ON DELETE SET NULL,
  role_id uuid NOT NULL REFERENCES public.system_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_roles_profile_role_inspector_uidx
  ON public.membership_roles (
    profile_id,
    role_id,
    (COALESCE(inspector_id, '00000000-0000-0000-0000-000000000000'::uuid))
  );
