-- Add shares_count column to feed_posts for tracking share counts
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0;

-- Add shared_post_id column to feed_posts for referencing shared posts
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.feed_posts(id) ON DELETE SET NULL;

-- Create index for shared_post_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_feed_posts_shared_post_id ON public.feed_posts(shared_post_id);

-- Create a security definer function to count all accepted friendships (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_total_friendship_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.friendships
  WHERE status = 'accepted'
$$;