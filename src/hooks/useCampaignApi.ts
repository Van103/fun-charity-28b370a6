import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CampaignFilters {
  category?: string;
  status?: string;
  region?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  min_goal?: number;
  max_goal?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CampaignCreator {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  bio?: string | null;
}

export interface CampaignMedia {
  id: string;
  campaign_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  is_proof: boolean | null;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  category: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  cover_image_url: string | null;
  video_url: string | null;
  location: string | null;
  region: string | null;
  status: string;
  is_verified: boolean | null;
  is_featured: boolean | null;
  end_date: string | null;
  start_date: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator?: CampaignCreator;
  media?: CampaignMedia[];
  updates?: CampaignUpdate[];
  stats?: {
    total_raised: number;
    donor_count: number;
    donation_count: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PlatformStats {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_raised: number;
  total_donors: number;
  total_donations: number;
}

export interface CampaignCreateData {
  title: string;
  description?: string;
  short_description?: string;
  category?: string;
  goal_amount: number;
  currency?: string;
  cover_image_url?: string;
  video_url?: string;
  location?: string;
  region?: string;
  end_date?: string;
  wallet_address?: string;
}

export function useCampaignApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`,
      }),
    };
  }, []);

  const listCampaigns = useCallback(async (filters: CampaignFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/list?${params.toString()}`,
        { headers }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch campaigns');
      }

      return {
        campaigns: result.data as Campaign[],
        pagination: result.pagination as PaginationInfo,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể tải danh sách chiến dịch');
      return { campaigns: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/${campaignId}`,
        { headers }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch campaign');
      }

      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể tải thông tin chiến dịch');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const createCampaign = useCallback(async (data: CampaignCreateData) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/create`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign');
      }

      toast.success('Chiến dịch đã được tạo thành công!');
      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể tạo chiến dịch');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const updateCampaign = useCallback(async (campaignId: string, data: Partial<CampaignCreateData>) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/${campaignId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update campaign');
      }

      toast.success('Chiến dịch đã được cập nhật!');
      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể cập nhật chiến dịch');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const updateCampaignStatus = useCallback(async (campaignId: string, status: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/${campaignId}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      toast.success('Trạng thái chiến dịch đã được cập nhật!');
      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể cập nhật trạng thái');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const deleteCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/${campaignId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete campaign');
      }

      toast.success('Chiến dịch đã được xóa!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể xóa chiến dịch');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getPlatformStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-api/stats`,
        { headers }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return result.data as PlatformStats;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    loading,
    error,
    listCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
    getPlatformStats,
  };
}
