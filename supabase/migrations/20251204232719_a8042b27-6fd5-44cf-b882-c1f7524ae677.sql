-- Add image_url column to post_comments for image/GIF uploads
ALTER TABLE public.post_comments ADD COLUMN image_url text;

-- Create comment_reactions table for emoji reactions
CREATE TABLE public.comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Create post_reactions table for post emoji reactions
CREATE TABLE public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_reactions
CREATE POLICY "Reactions are viewable by everyone" 
ON public.comment_reactions FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" 
ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" 
ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for post_reactions
CREATE POLICY "Post reactions are viewable by everyone" 
ON public.post_reactions FOR SELECT USING (true);

CREATE POLICY "Users can add post reactions" 
ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their post reactions" 
ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);