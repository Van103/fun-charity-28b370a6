-- Fix messages RLS policies to support group conversations
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create updated SELECT policy for both direct and group conversations
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      -- For non-group conversations, check participant fields
      (NOT COALESCE(conversations.is_group, false) AND 
       (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid()))
      OR
      -- For group conversations, check participants table
      (COALESCE(conversations.is_group, false) AND
       EXISTS (
         SELECT 1 FROM public.conversation_participants cp
         WHERE cp.conversation_id = conversations.id
         AND cp.user_id = auth.uid()
       ))
    )
  )
);

-- Create updated INSERT policy for both direct and group conversations
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      -- For non-group conversations, check participant fields
      (NOT COALESCE(conversations.is_group, false) AND 
       (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid()))
      OR
      -- For group conversations, check participants table
      (COALESCE(conversations.is_group, false) AND
       EXISTS (
         SELECT 1 FROM public.conversation_participants cp
         WHERE cp.conversation_id = conversations.id
         AND cp.user_id = auth.uid()
       ))
    )
  )
);