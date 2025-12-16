export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string
          description: string | null
          description_vi: string | null
          icon_url: string | null
          id: string
          is_nft: boolean | null
          name: string
          name_vi: string
          points_required: number | null
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          description?: string | null
          description_vi?: string | null
          icon_url?: string | null
          id?: string
          is_nft?: boolean | null
          name: string
          name_vi: string
          points_required?: number | null
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          description?: string | null
          description_vi?: string | null
          icon_url?: string | null
          id?: string
          is_nft?: boolean | null
          name?: string
          name_vi?: string
          points_required?: number | null
        }
        Relationships: []
      }
      campaign_audits: {
        Row: {
          action: string
          auditor_id: string | null
          campaign_id: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["campaign_status"] | null
          notes: string | null
          previous_status: Database["public"]["Enums"]["campaign_status"] | null
        }
        Insert: {
          action: string
          auditor_id?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["campaign_status"] | null
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["campaign_status"]
            | null
        }
        Update: {
          action?: string
          auditor_id?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["campaign_status"] | null
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["campaign_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_audits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_media: {
        Row: {
          campaign_id: string
          caption: string | null
          created_at: string
          id: string
          is_proof: boolean | null
          media_type: string
          media_url: string
        }
        Insert: {
          campaign_id: string
          caption?: string | null
          created_at?: string
          id?: string
          is_proof?: boolean | null
          media_type?: string
          media_url: string
        }
        Update: {
          campaign_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          is_proof?: boolean | null
          media_type?: string
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_media_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          author_id: string
          campaign_id: string
          content: string
          created_at: string
          id: string
          media_urls: Json | null
          title: string
        }
        Insert: {
          author_id: string
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          media_urls?: Json | null
          title: string
        }
        Update: {
          author_id?: string
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          media_urls?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["campaign_category"]
          contract_address: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          end_date: string | null
          goal_amount: number
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          location: string | null
          raised_amount: number
          region: string | null
          short_description: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string
          urgency_level: number | null
          video_url: string | null
          wallet_address: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["campaign_category"]
          contract_address?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          raised_amount?: number
          region?: string | null
          short_description?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string
          urgency_level?: number | null
          video_url?: string | null
          wallet_address?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["campaign_category"]
          contract_address?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          raised_amount?: number
          region?: string | null
          short_description?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string
          urgency_level?: number | null
          video_url?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_receipts: {
        Row: {
          created_at: string
          donation_id: string
          id: string
          pdf_url: string | null
          receipt_number: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          donation_id: string
          id?: string
          pdf_url?: string | null
          receipt_number: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          donation_id?: string
          id?: string
          pdf_url?: string | null
          receipt_number?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_receipts_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          amount_usd: number | null
          block_number: number | null
          campaign_id: string
          chain: string | null
          completed_at: string | null
          created_at: string
          currency: string
          donor_id: string | null
          id: string
          is_anonymous: boolean | null
          is_recurring: boolean | null
          message: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["donation_status"]
          stripe_payment_id: string | null
          stripe_receipt_url: string | null
          tx_hash: string | null
          wallet_from: string | null
          wallet_to: string | null
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          block_number?: number | null
          campaign_id: string
          chain?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["donation_status"]
          stripe_payment_id?: string | null
          stripe_receipt_url?: string | null
          tx_hash?: string | null
          wallet_from?: string | null
          wallet_to?: string | null
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          block_number?: number | null
          campaign_id?: string
          chain?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["donation_status"]
          stripe_payment_id?: string | null
          stripe_receipt_url?: string | null
          tx_hash?: string | null
          wallet_from?: string | null
          wallet_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          feed_post_id: string
          id: string
          image_url: string | null
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feed_post_id: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feed_post_id?: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_matches: {
        Row: {
          accepted_at: string | null
          category_score: number | null
          completed_at: string | null
          geo_score: number | null
          id: string
          match_score: number
          need_post_id: string
          notes: string | null
          reputation_score: number | null
          status: string
          suggested_at: string
          supply_post_id: string
          urgency_score: number | null
        }
        Insert: {
          accepted_at?: string | null
          category_score?: number | null
          completed_at?: string | null
          geo_score?: number | null
          id?: string
          match_score?: number
          need_post_id: string
          notes?: string | null
          reputation_score?: number | null
          status?: string
          suggested_at?: string
          supply_post_id: string
          urgency_score?: number | null
        }
        Update: {
          accepted_at?: string | null
          category_score?: number | null
          completed_at?: string | null
          geo_score?: number | null
          id?: string
          match_score?: number
          need_post_id?: string
          notes?: string | null
          reputation_score?: number | null
          status?: string
          suggested_at?: string
          supply_post_id?: string
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_matches_need_post_id_fkey"
            columns: ["need_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_matches_supply_post_id_fkey"
            columns: ["supply_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          beneficiaries_count: number | null
          campaign_id: string | null
          category: Database["public"]["Enums"]["campaign_category"] | null
          content: string | null
          created_at: string
          estimated_delivery: string | null
          expires_at: string | null
          fulfilled_amount: number | null
          id: string
          is_active: boolean | null
          is_matched: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          matched_with_id: string | null
          media_urls: Json | null
          offered_skills: string[] | null
          post_type: Database["public"]["Enums"]["feed_post_type"]
          region: string | null
          required_skills: string[] | null
          target_amount: number | null
          title: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Insert: {
          beneficiaries_count?: number | null
          campaign_id?: string | null
          category?: Database["public"]["Enums"]["campaign_category"] | null
          content?: string | null
          created_at?: string
          estimated_delivery?: string | null
          expires_at?: string | null
          fulfilled_amount?: number | null
          id?: string
          is_active?: boolean | null
          is_matched?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          matched_with_id?: string | null
          media_urls?: Json | null
          offered_skills?: string[] | null
          post_type?: Database["public"]["Enums"]["feed_post_type"]
          region?: string | null
          required_skills?: string[] | null
          target_amount?: number | null
          title?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Update: {
          beneficiaries_count?: number | null
          campaign_id?: string | null
          category?: Database["public"]["Enums"]["campaign_category"] | null
          content?: string | null
          created_at?: string
          estimated_delivery?: string | null
          expires_at?: string | null
          fulfilled_amount?: number | null
          id?: string
          is_active?: boolean | null
          is_matched?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          matched_with_id?: string | null
          media_urls?: Json | null
          offered_skills?: string[] | null
          post_type?: Database["public"]["Enums"]["feed_post_type"]
          region?: string | null
          required_skills?: string[] | null
          target_amount?: number | null
          title?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_matched_with_id_fkey"
            columns: ["matched_with_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          feed_post_id: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_post_id: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_post_id?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_requests: {
        Row: {
          additional_docs: Json | null
          business_license_url: string | null
          created_at: string
          id: string
          id_document_url: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          additional_docs?: Json | null
          business_license_url?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          rejection_reason?: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          additional_docs?: Json | null
          business_license_url?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_campaigns: boolean | null
          email_donations: boolean | null
          email_social: boolean | null
          id: string
          push_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_campaigns?: boolean | null
          email_donations?: boolean | null
          email_social?: boolean | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_campaigns?: boolean | null
          email_donations?: boolean | null
          email_social?: boolean | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          media_urls: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_urls?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_urls?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_details: {
        Row: {
          created_at: string
          detail_type: string
          display_order: number | null
          id: string
          is_current: boolean | null
          is_visible: boolean | null
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail_type: string
          display_order?: number | null
          id?: string
          is_current?: boolean | null
          is_visible?: boolean | null
          subtitle?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail_type?: string
          display_order?: number | null
          id?: string
          is_current?: boolean | null
          is_visible?: boolean | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          reputation_score: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          reputation_score?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          reputation_score?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          evidence_urls: Json | null
          id: string
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reputation_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          updated_at: string
          user_id: string
          wallet_address: string | null
          wallet_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      badge_type:
        | "donor_bronze"
        | "donor_silver"
        | "donor_gold"
        | "donor_platinum"
        | "donor_diamond"
        | "volunteer_starter"
        | "volunteer_active"
        | "volunteer_hero"
        | "first_donation"
        | "recurring_donor"
        | "campaign_creator"
        | "verified_ngo"
        | "community_helper"
        | "early_adopter"
      campaign_category:
        | "education"
        | "healthcare"
        | "disaster_relief"
        | "poverty"
        | "environment"
        | "animal_welfare"
        | "community"
        | "other"
      campaign_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "active"
        | "paused"
        | "completed"
        | "rejected"
        | "cancelled"
      donation_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      feed_post_type: "need" | "supply" | "update" | "story"
      kyc_status: "pending" | "approved" | "rejected" | "expired"
      notification_type:
        | "donation_received"
        | "donation_confirmed"
        | "campaign_approved"
        | "campaign_rejected"
        | "campaign_funded"
        | "badge_earned"
        | "friend_request"
        | "comment_reply"
        | "system_announcement"
      payment_method:
        | "fiat_card"
        | "fiat_bank_transfer"
        | "crypto_eth"
        | "crypto_btc"
        | "crypto_usdt"
        | "crypto_other"
      report_status: "pending" | "investigating" | "resolved" | "dismissed"
      report_type:
        | "fraud"
        | "spam"
        | "inappropriate_content"
        | "fake_campaign"
        | "misuse_of_funds"
        | "other"
      urgency_level: "low" | "medium" | "high" | "critical"
      user_role: "donor" | "volunteer" | "ngo" | "beneficiary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      badge_type: [
        "donor_bronze",
        "donor_silver",
        "donor_gold",
        "donor_platinum",
        "donor_diamond",
        "volunteer_starter",
        "volunteer_active",
        "volunteer_hero",
        "first_donation",
        "recurring_donor",
        "campaign_creator",
        "verified_ngo",
        "community_helper",
        "early_adopter",
      ],
      campaign_category: [
        "education",
        "healthcare",
        "disaster_relief",
        "poverty",
        "environment",
        "animal_welfare",
        "community",
        "other",
      ],
      campaign_status: [
        "draft",
        "pending_review",
        "approved",
        "active",
        "paused",
        "completed",
        "rejected",
        "cancelled",
      ],
      donation_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      feed_post_type: ["need", "supply", "update", "story"],
      kyc_status: ["pending", "approved", "rejected", "expired"],
      notification_type: [
        "donation_received",
        "donation_confirmed",
        "campaign_approved",
        "campaign_rejected",
        "campaign_funded",
        "badge_earned",
        "friend_request",
        "comment_reply",
        "system_announcement",
      ],
      payment_method: [
        "fiat_card",
        "fiat_bank_transfer",
        "crypto_eth",
        "crypto_btc",
        "crypto_usdt",
        "crypto_other",
      ],
      report_status: ["pending", "investigating", "resolved", "dismissed"],
      report_type: [
        "fraud",
        "spam",
        "inappropriate_content",
        "fake_campaign",
        "misuse_of_funds",
        "other",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
      user_role: ["donor", "volunteer", "ngo", "beneficiary"],
    },
  },
} as const
