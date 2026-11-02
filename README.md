# Intime API

NestJS backend for Intime car inspections. Shared by the `frontend` (Driver + Inspector) and `admin` apps.

## Stack

- NestJS + Prisma 7 (Supabase Postgres)
- Supabase Auth JWT verification (`jose` JWKS)
- RBAC: `profiles`, `system_roles`, `system_permissions`, `role_permissions`, `membership_roles`, `inspection_centers`

## Local development

```bash
cp .env.example .env
# Fill DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# (service role required to invite mechanics)
# Optional: RESEND_API_KEY + EMAIL_FROM for driver completion emails
npm install
npx playwright install chromium
# On macOS 12+, if Playwright browsers are unsupported, install Google Chrome
# (PDF generation falls back to channel: chrome) or set
# PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
npm run prisma:generate
npm run start:dev
```

API listens on `http://localhost:3001` by default.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /` | No | Service identity |
| `GET /health` | No | Health check (Render) |
| `GET /auth/me` | Bearer | Profile, roles, permissions, memberships |
| `GET/POST /centers` | Admin | List / create inspection centers |
| `GET/PATCH/DELETE /centers/:id` | Admin | Center detail / update / delete |
| `GET/POST /mechanics` | Admin | List / invite inspectors |
| `PATCH/DELETE /mechanics/:membershipId` | Admin | Update / remove inspector membership |
| `GET/POST /inspections` | Inspector | List / create inspections |
| `GET /inspections/:id` | Inspector | Inspection detail |
| `POST /inspections/:id/photos` | Inspector | Upload inspection photo slot |
| `GET /inspections/:id/report.pdf` | Inspector | Download Fleet Comfort PDF report |

## Database

Schema was applied to the Intime Supabase project. To re-seed roles/permissions locally:

```bash
npm run prisma:seed
```

System roles: `admin`, `inspector` (`system_role = true`).

### Seeded admin (dev)

- **Email:** `eu@creedbox.com` (Emmanuel Ufot) — sign in via Admin email OTP
- **Role:** `admin` (system-wide; `center_id` null)
- **Sample center:** `lekki-vehicle-hub` (Lekki Vehicle Hub, Lagos, verified) — not linked to the admin

### Bootstrap additional users

1. Create users in Supabase Auth (Dashboard → Authentication).
2. Confirm a `profiles` row exists (auto-created by trigger on signup).
3. Grant membership:

```sql
-- Admin linked to a center
insert into public.membership_roles (profile_id, role_id, center_id)
select p.id, r.id, c.id
from public.profiles p
join public.system_roles r on r.name = 'admin'
join public.inspection_centers c on c.slug = 'lekki-vehicle-hub'
where p.id = '<auth-user-uuid>';

-- Inspector (scoped to a center)
insert into public.membership_roles (profile_id, role_id, center_id)
select p.id, r.id, c.id
from public.profiles p
join public.system_roles r on r.name = 'inspector'
join public.inspection_centers c on c.slug = '<center-slug>'
where p.id = '<auth-user-uuid>';
```

## Deploy (Render)

Use `render.yaml` or create a Node web service with:

- **Root directory:** `api`
- **Build:** `npm ci && npx playwright install --with-deps chromium && npm run build`
- **Start:** `npm run start:prod`
- **Health check path:** `/health`

Set `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, `ADMIN_URL`, `RESEND_API_KEY`, and `EMAIL_FROM` in the Render dashboard.

Completed inspections generate a Fleet Comfort PDF (Playwright), store it under `centers/{centerId}/inspection/{id}/report.pdf`, and attach it to the driver email.
