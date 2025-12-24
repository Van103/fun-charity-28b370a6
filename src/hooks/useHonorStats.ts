import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HonorStats {
  topProfiles: number;
  totalEarnings: number;
  totalPosts: number;
  videosCount: number;
  friendsCount: number;
  nftCount: number;
}

async function fetchHonorStats(): Promise<HonorStats> {
  // Fetch total profiles count
  const { count: profilesCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Fetch total donations amount (earnings)
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("status", "completed");

  const totalEarnings = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  // Fetch total posts count
  const { count: postsCount } = await supabase
    .from("feed_posts")
    .select("*", { count: "exact", head: true });

  // Fetch videos count (posts with video in media_urls)
  const { data: mediaPosts } = await supabase
    .from("feed_posts")
    .select("media_urls");

  const videosCount = mediaPosts?.filter(post => {
    const urls = post.media_urls as string[] | null;
    return urls?.some(url => 
      url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
    );
  }).length || 0;

  // Fetch friends/connections count
  const { data: friendshipData } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .eq("status", "accepted");
  
  const uniqueUsers = new Set<string>();
  friendshipData?.forEach(f => {
    uniqueUsers.add(f.user_id);
    uniqueUsers.add(f.friend_id);
  });
  const friendsCount = uniqueUsers.size;

  // Fetch NFT badges count
  const { count: nftCount } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true });

  return {
    topProfiles: profilesCount || 0,
    totalEarnings,
    totalPosts: postsCount || 0,
    videosCount,
    friendsCount: friendsCount || 0,
    nftCount: nftCount || 0,
  };
}

export function useHonorStats() {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channels = [
      supabase
        .channel('honor-profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          queryClient.invalidateQueries({ queryKey: ["honor-stats"] });
        })
        .subscribe(),
      supabase
        .channel('honor-donations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
          queryClient.invalidateQueries({ queryKey: ["honor-stats"] });
        })
        .subscribe(),
      supabase
        .channel('honor-posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, () => {
          queryClient.invalidateQueries({ queryKey: ["honor-stats"] });
        })
        .subscribe(),
      supabase
        .channel('honor-friendships')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
          queryClient.invalidateQueries({ queryKey: ["honor-stats"] });
        })
        .subscribe(),
      supabase
        .channel('honor-badges')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => {
          queryClient.invalidateQueries({ queryKey: ["honor-stats"] });
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["honor-stats"],
    queryFn: fetchHonorStats,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export interface TopRanker {
  rank: number;
  name: string;
  amount: number;
  avatar?: string;
  verified?: boolean;
  userId: string;
}

export function useTopRankers() {
  return useQuery({
    queryKey: ["top-rankers"],
    queryFn: async (): Promise<TopRanker[]> => {
      // Get top donors by total donation amount
      const { data: donations } = await supabase
        .from("donations")
        .select("donor_id, amount")
        .eq("status", "completed")
        .not("donor_id", "is", null);

      if (!donations || donations.length === 0) {
        return [];
      }

      // Aggregate by donor
      const donorTotals: Record<string, number> = {};
      donations.forEach(d => {
        if (d.donor_id) {
          donorTotals[d.donor_id] = (donorTotals[d.donor_id] || 0) + Number(d.amount);
        }
      });

      // Sort and get top 10
      const sortedDonors = Object.entries(donorTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // Fetch profiles for top donors
      const donorIds = sortedDonors.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", donorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return sortedDonors.map(([userId, amount], index) => {
        const profile = profileMap.get(userId);
        return {
          rank: index + 1,
          name: profile?.full_name || "Anonymous",
          amount,
          avatar: profile?.avatar_url || undefined,
          verified: profile?.is_verified || false,
          userId,
        };
      });
    },
    staleTime: 60000,
  });
}
