import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DonationNotification {
  id: string;
  amount: number;
  currency: string;
  campaignTitle: string;
  donorName: string | null;
  isAnonymous: boolean;
}

const playNotificationSound = () => {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (error) {
    console.log("Could not play notification sound");
  }
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function useDonationNotifications(userId: string | null) {
  const [followedCampaigns, setFollowedCampaigns] = useState<string[]>([]);

  // Get campaigns the user is following (campaigns they created or donated to)
  useEffect(() => {
    if (!userId) return;

    const fetchFollowedCampaigns = async () => {
      // Get campaigns created by user
      const { data: createdCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("creator_id", userId);

      // Get campaigns user donated to
      const { data: donatedCampaigns } = await supabase
        .from("donations")
        .select("campaign_id")
        .eq("donor_id", userId)
        .eq("status", "completed");

      const campaignIds = new Set<string>();
      
      createdCampaigns?.forEach(c => campaignIds.add(c.id));
      donatedCampaigns?.forEach(d => campaignIds.add(d.campaign_id));
      
      setFollowedCampaigns(Array.from(campaignIds));
    };

    fetchFollowedCampaigns();
  }, [userId]);

  // Subscribe to real-time donation updates
  useEffect(() => {
    if (!userId || followedCampaigns.length === 0) return;

    const channel = supabase
      .channel("donation-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
        },
        async (payload) => {
          const donation = payload.new as any;
          
          // Only notify for completed donations to followed campaigns
          if (
            donation.status !== "completed" || 
            !followedCampaigns.includes(donation.campaign_id) ||
            donation.donor_id === userId // Don't notify for own donations
          ) {
            return;
          }

          // Fetch campaign details
          const { data: campaign } = await supabase
            .from("campaigns")
            .select("title, creator_id")
            .eq("id", donation.campaign_id)
            .single();

          if (!campaign) return;

          // Fetch donor profile if not anonymous
          let donorName = null;
          if (!donation.is_anonymous && donation.donor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", donation.donor_id)
              .single();
            donorName = profile?.full_name;
          }

          // Play sound and show toast
          playNotificationSound();

          const donorDisplay = donation.is_anonymous ? "Người ủng hộ ẩn danh" : (donorName || "Ai đó");
          const amountDisplay = formatCurrency(donation.amount, donation.currency);

          toast.success(
            `${donorDisplay} vừa quyên góp ${amountDisplay}`,
            {
              description: `Cho chiến dịch: ${campaign.title}`,
              duration: 5000,
            }
          );

          // Create notification record if it's the user's campaign
          if (campaign.creator_id === userId) {
            await supabase.from("notifications").insert({
              user_id: userId,
              type: "donation_received" as const,
              title: "Quyên góp mới",
              message: `${donorDisplay} đã quyên góp ${amountDisplay} cho chiến dịch "${campaign.title}"`,
              data: {
                donation_id: donation.id,
                campaign_id: donation.campaign_id,
                amount: donation.amount,
                currency: donation.currency,
              },
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
        },
        async (payload) => {
          const donation = payload.new as any;
          const oldDonation = payload.old as any;
          
          // Only notify when donation status changes to completed
          if (
            oldDonation.status !== "completed" && 
            donation.status === "completed" &&
            followedCampaigns.includes(donation.campaign_id) &&
            donation.donor_id !== userId
          ) {
            // Fetch campaign details
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("title, creator_id")
              .eq("id", donation.campaign_id)
              .single();

            if (!campaign) return;

            // Fetch donor profile if not anonymous
            let donorName = null;
            if (!donation.is_anonymous && donation.donor_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", donation.donor_id)
                .single();
              donorName = profile?.full_name;
            }

            // Play sound and show toast
            playNotificationSound();

            const donorDisplay = donation.is_anonymous ? "Người ủng hộ ẩn danh" : (donorName || "Ai đó");
            const amountDisplay = formatCurrency(donation.amount, donation.currency);

            toast.success(
              `${donorDisplay} vừa quyên góp ${amountDisplay}`,
              {
                description: `Cho chiến dịch: ${campaign.title}`,
                duration: 5000,
              }
            );

            // Create notification record if it's the user's campaign
            if (campaign.creator_id === userId) {
              await supabase.from("notifications").insert({
                user_id: userId,
                type: "donation_received" as const,
                title: "Quyên góp mới",
                message: `${donorDisplay} đã quyên góp ${amountDisplay} cho chiến dịch "${campaign.title}"`,
                data: {
                  donation_id: donation.id,
                  campaign_id: donation.campaign_id,
                  amount: donation.amount,
                  currency: donation.currency,
                },
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, followedCampaigns]);

  return { followedCampaigns };
}
