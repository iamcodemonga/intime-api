-- Persist generated Fleet Comfort PDF path in storage
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS report_storage_path TEXT;
