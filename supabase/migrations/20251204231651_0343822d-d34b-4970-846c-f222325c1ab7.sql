-- Add media_urls column to posts table for multiple images/videos
ALTER TABLE public.posts ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;

-- Migrate existing image_url data to media_urls
UPDATE public.posts 
SET media_urls = jsonb_build_array(jsonb_build_object('url', image_url, 'type', 'image'))
WHERE image_url IS NOT NULL;