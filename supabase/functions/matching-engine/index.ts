import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedPost {
  id: string;
  user_id: string;
  post_type: string;
  title: string;
  content: string;
  location: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  urgency: string;
  target_amount: number;
  is_active: boolean;
  is_matched: boolean;
  profiles?: { reputation_score: number };
}

interface MatchResult {
  need_post_id: string;
  supply_post_id: string;
  match_score: number;
  geo_score: number;
  category_score: number;
  urgency_score: number;
  reputation_score: number;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate geo score based on distance (0-25 points)
function calculateGeoScore(need: FeedPost, supply: FeedPost): number {
  // Same region = 20 points
  if (need.region && supply.region && need.region === supply.region) {
    return 20;
  }
  
  // Calculate by coordinates if available
  if (need.latitude && need.longitude && supply.latitude && supply.longitude) {
    const distance = calculateDistance(
      need.latitude, need.longitude,
      supply.latitude, supply.longitude
    );
    
    if (distance < 50) return 25;      // < 50km = 25 points
    if (distance < 100) return 20;     // < 100km = 20 points
    if (distance < 500) return 15;     // < 500km = 15 points
    if (distance < 1000) return 10;    // < 1000km = 10 points
    return 5;                          // > 1000km = 5 points
  }
  
  // Same location string
  if (need.location && supply.location) {
    const needLoc = need.location.toLowerCase();
    const supplyLoc = supply.location.toLowerCase();
    if (needLoc.includes(supplyLoc) || supplyLoc.includes(needLoc)) {
      return 15;
    }
  }
  
  return 5; // Base score if no location match
}

// Calculate category score (0-25 points)
function calculateCategoryScore(need: FeedPost, supply: FeedPost): number {
  if (need.category && supply.category) {
    if (need.category === supply.category) return 25;
    
    // Related categories get partial score
    const relatedCategories: Record<string, string[]> = {
      'healthcare': ['community', 'disaster_relief'],
      'education': ['community', 'poverty'],
      'disaster_relief': ['healthcare', 'poverty', 'community'],
      'poverty': ['education', 'community'],
      'environment': ['community', 'animal_welfare'],
      'animal_welfare': ['environment', 'community'],
      'community': ['healthcare', 'education', 'poverty'],
    };
    
    if (relatedCategories[need.category]?.includes(supply.category)) {
      return 15;
    }
  }
  
  return 5;
}

// Calculate urgency score (0-25 points)
function calculateUrgencyScore(need: FeedPost, supply: FeedPost): number {
  const urgencyWeights: Record<string, number> = {
    'critical': 25,
    'high': 20,
    'medium': 15,
    'low': 10,
  };
  
  // Higher urgency needs get priority
  return urgencyWeights[need.urgency] || 10;
}

// Calculate reputation score based on supplier's reputation (0-25 points)
function calculateReputationScore(supply: FeedPost): number {
  const reputation = supply.profiles?.reputation_score || 0;
  
  if (reputation >= 100) return 25;
  if (reputation >= 50) return 20;
  if (reputation >= 20) return 15;
  if (reputation >= 10) return 10;
  return 5;
}

// Main matching function
function calculateMatch(need: FeedPost, supply: FeedPost): MatchResult {
  const geoScore = calculateGeoScore(need, supply);
  const categoryScore = calculateCategoryScore(need, supply);
  const urgencyScore = calculateUrgencyScore(need, supply);
  const reputationScore = calculateReputationScore(supply);
  
  const totalScore = geoScore + categoryScore + urgencyScore + reputationScore;
  
  return {
    need_post_id: need.id,
    supply_post_id: supply.id,
    match_score: totalScore,
    geo_score: geoScore,
    category_score: categoryScore,
    urgency_score: urgencyScore,
    reputation_score: reputationScore,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication - require valid JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Use service role client for database operations (after auth verification)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, need_post_id, limit: rawLimit } = body as { action?: unknown; need_post_id?: unknown; limit?: unknown };

    // Validate action
    const validActions = ["find_matches", "run_batch_matching"];
    if (!action || typeof action !== 'string' || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be 'find_matches' or 'run_batch_matching'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate need_post_id for find_matches action (must be valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (action === "find_matches") {
      if (!need_post_id || typeof need_post_id !== 'string' || !uuidRegex.test(need_post_id)) {
        return new Response(
          JSON.stringify({ error: "Invalid need_post_id. Must be a valid UUID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate and bound limit (1-50, default 10)
    let limit = 10;
    if (rawLimit !== undefined) {
      if (typeof rawLimit !== 'number' || !Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
        return new Response(
          JSON.stringify({ error: "Invalid limit. Must be an integer between 1 and 50" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      limit = rawLimit;
    }

    console.log(`Matching Engine: action=${action}, need_post_id=${need_post_id}, user=${user.id}, limit=${limit}`);

    if (action === "find_matches") {
      // Get the need post
      const { data: needPost, error: needError } = await supabase
        .from("feed_posts")
        .select("*, profiles:user_id(reputation_score)")
        .eq("id", need_post_id)
        .eq("post_type", "need")
        .eq("is_active", true)
        .single();

      if (needError || !needPost) {
        console.error("Need post not found:", needError);
        return new Response(
          JSON.stringify({ error: "Need post not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all active supply posts
      const { data: supplyPosts, error: supplyError } = await supabase
        .from("feed_posts")
        .select("*, profiles:user_id(reputation_score)")
        .eq("post_type", "supply")
        .eq("is_active", true)
        .eq("is_matched", false);

      if (supplyError) {
        console.error("Error fetching supply posts:", supplyError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch supply posts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate matches
      const matches = (supplyPosts || [])
        .map(supply => calculateMatch(needPost as FeedPost, supply as FeedPost))
        .filter(match => match.match_score >= 30) // Minimum threshold
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit);

      console.log(`Found ${matches.length} matches for need ${need_post_id}`);

      return new Response(
        JSON.stringify({ matches }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "run_batch_matching") {
      // Get all unmatched need posts
      const { data: needPosts, error: needsError } = await supabase
        .from("feed_posts")
        .select("*, profiles:user_id(reputation_score)")
        .eq("post_type", "need")
        .eq("is_active", true)
        .eq("is_matched", false);

      if (needsError) {
        console.error("Error fetching need posts:", needsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch need posts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all unmatched supply posts
      const { data: supplyPosts, error: supplyError } = await supabase
        .from("feed_posts")
        .select("*, profiles:user_id(reputation_score)")
        .eq("post_type", "supply")
        .eq("is_active", true)
        .eq("is_matched", false);

      if (supplyError) {
        console.error("Error fetching supply posts:", supplyError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch supply posts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate all possible matches
      const allMatches: MatchResult[] = [];
      
      for (const need of (needPosts || [])) {
        for (const supply of (supplyPosts || [])) {
          const match = calculateMatch(need as FeedPost, supply as FeedPost);
          if (match.match_score >= 40) { // Higher threshold for batch
            allMatches.push(match);
          }
        }
      }

      // Sort by score and insert top matches
      const topMatches = allMatches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 50);

      if (topMatches.length > 0) {
        const { error: insertError } = await supabase
          .from("feed_matches")
          .upsert(
            topMatches.map(m => ({
              ...m,
              status: 'suggested',
            })),
            { onConflict: 'need_post_id,supply_post_id' }
          );

        if (insertError) {
          console.error("Error inserting matches:", insertError);
        }
      }

      console.log(`Batch matching complete: ${topMatches.length} matches created`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          matches_created: topMatches.length,
          needs_processed: needPosts?.length || 0,
          supplies_processed: supplyPosts?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Matching Engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
