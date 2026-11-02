-- Split inspections.driver_name into driver_firstname + driver_lastname

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS driver_firstname TEXT,
  ADD COLUMN IF NOT EXISTS driver_lastname TEXT;

UPDATE public.inspections
SET
  driver_firstname = COALESCE(NULLIF(split_part(driver_name, ' ', 1), ''), driver_name, ''),
  driver_lastname = COALESCE(
    NULLIF(trim(both FROM substring(driver_name FROM position(' ' IN driver_name) + 1)), ''),
    ''
  )
WHERE driver_name IS NOT NULL
  AND (driver_firstname IS NULL OR driver_lastname IS NULL);

UPDATE public.inspections SET driver_firstname = '' WHERE driver_firstname IS NULL;
UPDATE public.inspections SET driver_lastname = '' WHERE driver_lastname IS NULL;

ALTER TABLE public.inspections
  ALTER COLUMN driver_firstname SET NOT NULL,
  ALTER COLUMN driver_lastname SET NOT NULL;

ALTER TABLE public.inspections DROP COLUMN IF EXISTS driver_name;
