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
  try {
    // Fetch total profiles count
    const { count: profilesCount, error: profilesError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch total donations amount (earnings) - only completed
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("amount")
      .eq("status", "completed");

    const totalEarnings = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Fetch total posts count
    const { count: postsCount, error: postsError } = await supabase
      .from("feed_posts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch videos count (posts with video in media_urls)
    const { data: mediaPosts } = await supabase
      .from("feed_posts")
      .select("media_urls")
      .eq("is_active", true);

    const videosCount = mediaPosts?.filter(post => {
      const urls = post.media_urls as string[] | null;
      return urls?.some(url => 
        url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
      );
    }).length || 0;

    // Fetch friends/connections count using RPC function (bypasses RLS)
    const { data: friendsCountData, error: friendsError } = await supabase
      .rpc("get_total_friendship_count");
    
    const friendsCount = friendsCountData || 0;

    // Fetch NFT badges count
    const { count: nftCount, error: nftError } = await supabase
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
  } catch (error) {
    console.error("Error fetching honor stats:", error);
    return {
      topProfiles: 0,
      totalEarnings: 0,
      totalPosts: 0,
      videosCount: 0,
      friendsCount: 0,
      nftCount: 0,
    };
  }
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
      try {
        // Get top donors by total donation amount
        const { data: donations, error } = await supabase
          .from("donations")
          .select("donor_id, amount")
          .eq("status", "completed")
          .not("donor_id", "is", null);

        if (error || !donations || donations.length === 0) {
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

        if (sortedDonors.length === 0) {
          return [];
        }

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
      } catch (error) {
        console.error("Error fetching top rankers:", error);
        return [];
      }
    },
    staleTime: 60000,
  });
}
