-- Fix 1: Profiles - Restrict visibility (owner can see own, or be friends)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view profiles of their friends (accepted friendships)
CREATE POLICY "Users can view friends profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND (
      (user_id = auth.uid() AND friend_id = profiles.user_id)
      OR (friend_id = auth.uid() AND user_id = profiles.user_id)
    )
  )
);

-- Fix 2: Reputation Events - Users can only view their own events
DROP POLICY IF EXISTS "Anyone can view reputation events" ON public.reputation_events;
DROP POLICY IF EXISTS "Users can view own reputation events" ON public.reputation_events;
DROP POLICY IF EXISTS "Users can view own reputation" ON public.reputation_events;

CREATE POLICY "Users can view own reputation events"
ON public.reputation_events
FOR SELECT
USING (auth.uid() = user_id);