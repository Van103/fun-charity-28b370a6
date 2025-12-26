-- Add new values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'donor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ngo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beneficiary';