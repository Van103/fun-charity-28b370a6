import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface FeedReaction {
  id: string;
  feed_post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export function usePostReactions(postId: string) {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Fetch reactions for the post
  const reactionsQuery = useQuery({
    queryKey: ["feed-reactions", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_reactions")
        .select("*")
        .eq("feed_post_id", postId);

      if (error) throw error;
      return data as FeedReaction[];
    },
  });

  // Get user's current reaction
  const userReaction = reactionsQuery.data?.find(
    (r) => r.user_id === currentUserId
  )?.reaction_type;

  // Count reactions by type
  const reactionCounts = reactionsQuery.data?.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Add reaction mutation
  const addReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Remove existing reaction first
      await supabase
        .from("feed_reactions")
        .delete()
        .eq("feed_post_id", postId)
        .eq("user_id", user.user.id);

      // Add new reaction
      const { data, error } = await supabase
        .from("feed_reactions")
        .insert({
          feed_post_id: postId,
          user_id: user.user.id,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (reactionType) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["feed-reactions", postId] });

      // Snapshot previous value
      const previousReactions = queryClient.getQueryData<FeedReaction[]>([
        "feed-reactions",
        postId,
      ]);

      // Optimistically update
      if (currentUserId && previousReactions) {
        const filtered = previousReactions.filter(
          (r) => r.user_id !== currentUserId
        );
        queryClient.setQueryData<FeedReaction[]>(
          ["feed-reactions", postId],
          [
            ...filtered,
            {
              id: "temp-" + Date.now(),
              feed_post_id: postId,
              user_id: currentUserId,
              reaction_type: reactionType,
              created_at: new Date().toISOString(),
            },
          ]
        );
      }

      return { previousReactions };
    },
    onError: (_, __, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          ["feed-reactions", postId],
          context.previousReactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-reactions", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts-infinite"] });
    },
  });

  // Remove reaction mutation
  const removeReaction = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feed_reactions")
        .delete()
        .eq("feed_post_id", postId)
        .eq("user_id", user.user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed-reactions", postId] });

      const previousReactions = queryClient.getQueryData<FeedReaction[]>([
        "feed-reactions",
        postId,
      ]);

      if (currentUserId && previousReactions) {
        queryClient.setQueryData<FeedReaction[]>(
          ["feed-reactions", postId],
          previousReactions.filter((r) => r.user_id !== currentUserId)
        );
      }

      return { previousReactions };
    },
    onError: (_, __, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          ["feed-reactions", postId],
          context.previousReactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-reactions", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts-infinite"] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`feed-reactions-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feed_reactions",
          filter: `feed_post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed-reactions", postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return {
    reactions: reactionsQuery.data || [],
    userReaction,
    reactionCounts,
    totalReactions: reactionsQuery.data?.length || 0,
    isLoading: reactionsQuery.isLoading,
    addReaction,
    removeReaction,
  };
}
