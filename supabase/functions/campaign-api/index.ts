import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignFilters {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    console.log(`[campaign-api] ${req.method} ${url.pathname}`);

    // GET /campaign-api/list - List campaigns with filters
    if (req.method === 'GET' && action === 'list') {
      const filters: CampaignFilters = {
        category: url.searchParams.get('category') || undefined,
        status: url.searchParams.get('status') || undefined,
        region: url.searchParams.get('region') || undefined,
        is_verified: url.searchParams.get('is_verified') === 'true' ? true : undefined,
        is_featured: url.searchParams.get('is_featured') === 'true' ? true : undefined,
        min_goal: url.searchParams.get('min_goal') ? Number(url.searchParams.get('min_goal')) : undefined,
        max_goal: url.searchParams.get('max_goal') ? Number(url.searchParams.get('max_goal')) : undefined,
        search: url.searchParams.get('search') || undefined,
        page: Number(url.searchParams.get('page')) || 1,
        limit: Math.min(Number(url.searchParams.get('limit')) || 20, 100),
        sort_by: url.searchParams.get('sort_by') || 'created_at',
        sort_order: (url.searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
      };

      let query = supabaseClient
        .from('campaigns')
        .select(`
          *,
          creator:profiles!campaigns_creator_id_fkey(id, user_id, full_name, avatar_url, is_verified)
        `, { count: 'exact' });

      // Apply filters
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.region) query = query.eq('region', filters.region);
      if (filters.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
      if (filters.is_featured !== undefined) query = query.eq('is_featured', filters.is_featured);
      if (filters.min_goal) query = query.gte('goal_amount', filters.min_goal);
      if (filters.max_goal) query = query.lte('goal_amount', filters.max_goal);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Pagination
      const offset = (filters.page! - 1) * filters.limit!;
      query = query.range(offset, offset + filters.limit! - 1);

      // Sorting
      query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' });

      const { data, error, count } = await query;

      if (error) {
        console.error('[campaign-api] List error:', error);
        throw error;
      }

      console.log(`[campaign-api] Found ${count} campaigns`);

      return new Response(JSON.stringify({
        success: true,
        data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count,
          total_pages: Math.ceil((count || 0) / filters.limit!),
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /campaign-api/:id - Get single campaign
    if (req.method === 'GET' && action !== 'list' && action !== 'stats') {
      const campaignId = action;

      const { data, error } = await supabaseClient
        .from('campaigns')
        .select(`
          *,
          creator:profiles!campaigns_creator_id_fkey(id, user_id, full_name, avatar_url, is_verified, bio),
          media:campaign_media(*),
          updates:campaign_updates(*, author:profiles!campaign_updates_author_id_fkey(full_name, avatar_url))
        `)
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('[campaign-api] Get error:', error);
        throw error;
      }

      // Get donation stats
      const { data: donationStats } = await supabaseClient
        .from('donations')
        .select('amount, donor_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'completed');

      const stats = {
        total_raised: donationStats?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        donor_count: new Set(donationStats?.map(d => d.donor_id).filter(Boolean)).size,
        donation_count: donationStats?.length || 0,
      };

      console.log(`[campaign-api] Retrieved campaign ${campaignId}`);

      return new Response(JSON.stringify({
        success: true,
        data: { ...data, stats },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /campaign-api/create - Create campaign
    if (req.method === 'POST' && action === 'create') {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const campaignData = {
        creator_id: user.id,
        title: body.title,
        description: body.description,
        short_description: body.short_description,
        category: body.category || 'other',
        goal_amount: body.goal_amount,
        currency: body.currency || 'VND',
        cover_image_url: body.cover_image_url,
        video_url: body.video_url,
        location: body.location,
        region: body.region,
        end_date: body.end_date,
        wallet_address: body.wallet_address,
        status: 'draft',
      };

      const { data, error } = await supabaseClient
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        console.error('[campaign-api] Create error:', error);
        throw error;
      }

      console.log(`[campaign-api] Created campaign ${data.id}`);

      return new Response(JSON.stringify({ success: true, data }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /campaign-api/:id - Update campaign
    if (req.method === 'PUT') {
      const campaignId = action;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const updateData: Record<string, unknown> = {};
      
      // Allowed fields to update
      const allowedFields = [
        'title', 'description', 'short_description', 'category',
        'goal_amount', 'currency', 'cover_image_url', 'video_url',
        'location', 'region', 'end_date', 'wallet_address'
      ];
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      const { data, error } = await supabaseClient
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        console.error('[campaign-api] Update error:', error);
        throw error;
      }

      console.log(`[campaign-api] Updated campaign ${campaignId}`);

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /campaign-api/:id/status - Update campaign status
    if (req.method === 'PATCH' && url.pathname.endsWith('/status')) {
      const campaignId = pathParts[pathParts.length - 2];
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const validStatuses = ['draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'cancelled', 'rejected'];
      
      if (!validStatuses.includes(body.status)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('campaigns')
        .update({ status: body.status })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        console.error('[campaign-api] Status update error:', error);
        throw error;
      }

      console.log(`[campaign-api] Updated status of campaign ${campaignId} to ${body.status}`);

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /campaign-api/:id - Delete campaign (soft delete via status)
    if (req.method === 'DELETE') {
      const campaignId = action;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Only allow deleting draft campaigns
      const { data, error } = await supabaseClient
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('status', 'draft')
        .select()
        .single();

      if (error) {
        console.error('[campaign-api] Delete error:', error);
        throw error;
      }

      console.log(`[campaign-api] Deleted campaign ${campaignId}`);

      return new Response(JSON.stringify({ success: true, message: 'Campaign deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /campaign-api/stats - Get platform stats
    if (req.method === 'GET' && action === 'stats') {
      const { data: campaigns } = await supabaseClient
        .from('campaigns')
        .select('id, status, raised_amount, goal_amount')
        .in('status', ['active', 'completed']);

      const { data: donations } = await supabaseClient
        .from('donations')
        .select('amount, donor_id')
        .eq('status', 'completed');

      const stats = {
        total_campaigns: campaigns?.length || 0,
        active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
        completed_campaigns: campaigns?.filter(c => c.status === 'completed').length || 0,
        total_raised: donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        total_donors: new Set(donations?.map(d => d.donor_id).filter(Boolean)).size,
        total_donations: donations?.length || 0,
      };

      console.log('[campaign-api] Retrieved platform stats');

      return new Response(JSON.stringify({ success: true, data: stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[campaign-api] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
