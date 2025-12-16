-- Create conversation_participants table for group chat support
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations they're in"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Add is_group and name columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN is_group BOOLEAN DEFAULT false,
ADD COLUMN name TEXT,
ADD COLUMN created_by UUID;

-- Migrate existing conversations to participants table
INSERT INTO public.conversation_participants (conversation_id, user_id)
SELECT id, participant1_id FROM public.conversations WHERE participant1_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id)
SELECT id, participant2_id FROM public.conversations WHERE participant2_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create call_sessions table for video/audio calls
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('video', 'audio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'declined')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  signaling_data JSONB
);

-- Enable RLS for call_sessions
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls in their conversations"
ON public.call_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = call_sessions.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create calls in their conversations"
ON public.call_sessions FOR INSERT
WITH CHECK (
  caller_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update calls in their conversations"
ON public.call_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = call_sessions.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;