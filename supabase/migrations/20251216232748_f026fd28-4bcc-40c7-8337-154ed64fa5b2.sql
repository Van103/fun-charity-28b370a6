-- Create profile_details table for work and education history
CREATE TABLE public.profile_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detail_type TEXT NOT NULL CHECK (detail_type IN ('work', 'education', 'location', 'hometown', 'relationship')),
  title TEXT NOT NULL,
  subtitle TEXT,
  is_current BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view any visible profile details"
  ON public.profile_details FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Users can view own profile details"
  ON public.profile_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile details"
  ON public.profile_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile details"
  ON public.profile_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile details"
  ON public.profile_details FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_profile_details_user_id ON public.profile_details(user_id);
CREATE INDEX idx_profile_details_type ON public.profile_details(detail_type);

-- Trigger for updated_at
CREATE TRIGGER update_profile_details_updated_at
  BEFORE UPDATE ON public.profile_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();