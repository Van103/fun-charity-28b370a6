-- Fix PUBLIC_DATA_EXPOSURE: Require authentication to view profiles
-- This protects sensitive data like wallet addresses from unauthenticated scraping

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policy requiring authentication to view profiles
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);