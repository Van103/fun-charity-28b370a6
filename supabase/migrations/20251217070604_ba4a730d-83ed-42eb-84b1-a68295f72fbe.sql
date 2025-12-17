-- Fix 1: Feed Matches - Only admins can create matches (matching engine uses service role)
DROP POLICY IF EXISTS "System and admins can create matches" ON public.feed_matches;

CREATE POLICY "Only admins can create matches"
ON public.feed_matches FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Fix 2: Admin Audit Logs - Make immutable (no updates or deletes)
CREATE POLICY "Audit logs are immutable"
ON public.admin_actions FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON public.admin_actions FOR DELETE
USING (false);