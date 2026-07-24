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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          created_at: string | null
          dimension_id: string | null
          dimension_label: string | null
          id: string
          metric_type: string
          new_events: number | null
          new_users: number | null
          page_views: number | null
          snapshot_date: string
          total_bookings: number | null
          total_platform_fee: number | null
          total_revenue: number | null
        }
        Insert: {
          created_at?: string | null
          dimension_id?: string | null
          dimension_label?: string | null
          id?: string
          metric_type: string
          new_events?: number | null
          new_users?: number | null
          page_views?: number | null
          snapshot_date: string
          total_bookings?: number | null
          total_platform_fee?: number | null
          total_revenue?: number | null
        }
        Update: {
          created_at?: string | null
          dimension_id?: string | null
          dimension_label?: string | null
          id?: string
          metric_type?: string
          new_events?: number | null
          new_users?: number | null
          page_views?: number | null
          snapshot_date?: string
          total_bookings?: number | null
          total_platform_fee?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          created_at: string | null
          denial_reason: string | null
          event_id: string
          host_id: string
          id: string
          status: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          denial_reason?: string | null
          event_id: string
          host_id: string
          id?: string
          status: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          denial_reason?: string | null
          event_id?: string
          host_id?: string
          id?: string
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          quantity: number
          subtotal: number
          ticket_tier_id: string
          unit_price: number
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          quantity: number
          subtotal: number
          ticket_tier_id: string
          unit_price: number
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          subtotal?: number
          ticket_tier_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "v_ticket_availability"
            referencedColumns: ["tier_id"]
          },
        ]
      }
      bookings: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          booking_ref: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          event_id: string
          expires_at: string | null
          gst_on_fee: number | null
          host_payout: number
          id: string
          invoice_number: string | null
          invoice_url: string | null
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          platform_fee: number
          promo_code_id: string | null
          razorpay_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_amount: number | null
          refunded_at: string | null
          status: string | null
          subtotal: number
          taxable_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          booking_ref: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          event_id: string
          expires_at?: string | null
          gst_on_fee?: number | null
          host_payout: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee: number
          promo_code_id?: string | null
          razorpay_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          subtotal: number
          taxable_amount: number
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          booking_ref?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          event_id?: string
          expires_at?: string | null
          gst_on_fee?: number | null
          host_payout?: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee?: number
          promo_code_id?: string | null
          razorpay_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          subtotal?: number
          taxable_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_event_id: string | null
          created_at: string | null
          id: string
          is_blocked_by_p1: boolean | null
          is_blocked_by_p2: boolean | null
          is_muted_by_p1: boolean | null
          is_muted_by_p2: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          p1_deleted_at: string | null
          p2_deleted_at: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          context_event_id?: string | null
          created_at?: string | null
          id?: string
          is_blocked_by_p1?: boolean | null
          is_blocked_by_p2?: boolean | null
          is_muted_by_p1?: boolean | null
          is_muted_by_p2?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          p1_deleted_at?: string | null
          p2_deleted_at?: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          context_event_id?: string | null
          created_at?: string | null
          id?: string
          is_blocked_by_p1?: boolean | null
          is_blocked_by_p2?: boolean | null
          is_muted_by_p1?: boolean | null
          is_muted_by_p2?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          p1_deleted_at?: string | null
          p2_deleted_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_context_event_id_fkey"
            columns: ["context_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_context_event_id_fkey"
            columns: ["context_event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_likes: {
        Row: {
          created_at: string | null
          discussion_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discussion_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          discussion_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_likes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "event_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string | null
          event_id: string
          id: string
          sort_order: number | null
          speaker: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          sort_order?: number | null
          speaker?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          sort_order?: number | null
          speaker?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cohosts: {
        Row: {
          confirmed_at: string | null
          event_id: string
          host_user_id: string
          id: string
          invited_at: string | null
          is_confirmed: boolean | null
          role: string | null
        }
        Insert: {
          confirmed_at?: string | null
          event_id: string
          host_user_id: string
          id?: string
          invited_at?: string | null
          is_confirmed?: boolean | null
          role?: string | null
        }
        Update: {
          confirmed_at?: string | null
          event_id?: string
          host_user_id?: string
          id?: string
          invited_at?: string | null
          is_confirmed?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_discussions: {
        Row: {
          created_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          edited_at: string | null
          event_id: string
          id: string
          is_anonymous: boolean | null
          is_deleted: boolean | null
          is_host_reply: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          message: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          edited_at?: string | null
          event_id: string
          id?: string
          is_anonymous?: boolean | null
          is_deleted?: boolean | null
          is_host_reply?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          message: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          edited_at?: string | null
          event_id?: string
          id?: string
          is_anonymous?: boolean | null
          is_deleted?: boolean | null
          is_host_reply?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          message?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_discussions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_discussions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_discussions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faqs: {
        Row: {
          answer: string
          created_at: string | null
          event_id: string
          id: string
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          event_id: string
          id?: string
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          event_id?: string
          id?: string
          question?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          event_id: string
          id: string
          image_url: string
          is_cover: boolean | null
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          image_url: string
          is_cover?: boolean | null
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          image_url?: string
          is_cover?: boolean | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          interest_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          interest_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          interest_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          event_id: string
          flagged_reason: string | null
          helpful_count: number | null
          host_responded_at: string | null
          host_response: string | null
          id: string
          is_approved: boolean | null
          is_flagged: boolean | null
          rating: number
          rating_host: number | null
          rating_value: number | null
          rating_venue: number | null
          review_text: string | null
          reviewed_by: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_id: string
          flagged_reason?: string | null
          helpful_count?: number | null
          host_responded_at?: string | null
          host_response?: string | null
          id?: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          rating: number
          rating_host?: number | null
          rating_value?: number | null
          rating_venue?: number | null
          review_text?: string | null
          reviewed_by?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string
          flagged_reason?: string | null
          helpful_count?: number | null
          host_responded_at?: string | null
          host_response?: string | null
          id?: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          rating?: number
          rating_host?: number | null
          rating_value?: number | null
          rating_venue?: number | null
          review_text?: string | null
          reviewed_by?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_saves: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_saves_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_saves_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          event_id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          tag_id: string
        }
        Update: {
          event_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlist: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notified_at: string | null
          offer_expires_at: string | null
          position: number
          status: string | null
          ticket_tier_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notified_at?: string | null
          offer_expires_at?: string | null
          position: number
          status?: string | null
          ticket_tier_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notified_at?: string | null
          offer_expires_at?: string | null
          position?: number
          status?: string | null
          ticket_tier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "v_ticket_availability"
            referencedColumns: ["tier_id"]
          },
          {
            foreignKeyName: "event_waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          admin_notes: string | null
          booking_count: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category_id: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          doors_open_at: string | null
          end_datetime: string
          event_type: string | null
          external_ticket_url: string | null
          fts: unknown
          host_id: string
          id: string
          interests_count: number | null
          is_age_restricted: boolean | null
          is_featured: boolean | null
          is_recurring: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          location_id: string | null
          max_capacity: number | null
          meta_description: string | null
          meta_title: string | null
          min_age: number | null
          online_event_url: string | null
          online_platform: string | null
          online_url_reveal: string | null
          parent_event_id: string | null
          published_at: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          refund_cutoff_hours: number | null
          refund_policy: string | null
          refund_policy_text: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          saves_count: number | null
          short_description: string | null
          slug: string
          sponsor_expires_at: string | null
          start_datetime: string
          status: string | null
          ticketing_mode: string
          timezone: string
          title: string
          updated_at: string | null
          vertical_poster_url: string | null
          views_count: number | null
          host_page_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_at?: string | null
          end_datetime: string
          event_type?: string | null
          external_ticket_url?: string | null
          fts?: unknown
          host_id: string
          id?: string
          interests_count?: number | null
          is_age_restricted?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location_id?: string | null
          max_capacity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          online_event_url?: string | null
          online_platform?: string | null
          online_url_reveal?: string | null
          parent_event_id?: string | null
          published_at?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          refund_cutoff_hours?: number | null
          refund_policy?: string | null
          refund_policy_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          saves_count?: number | null
          short_description?: string | null
          slug: string
          sponsor_expires_at?: string | null
          start_datetime: string
          status?: string | null
          ticketing_mode?: string
          timezone?: string
          title: string
          updated_at?: string | null
          vertical_poster_url?: string | null
          views_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          booking_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          doors_open_at?: string | null
          end_datetime?: string
          event_type?: string | null
          external_ticket_url?: string | null
          fts?: unknown
          host_id?: string
          id?: string
          interests_count?: number | null
          is_age_restricted?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location_id?: string | null
          max_capacity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_age?: number | null
          online_event_url?: string | null
          online_platform?: string | null
          online_url_reveal?: string | null
          parent_event_id?: string | null
          published_at?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          refund_cutoff_hours?: number | null
          refund_policy?: string | null
          refund_policy_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          saves_count?: number | null
          short_description?: string | null
          slug?: string
          sponsor_expires_at?: string | null
          start_datetime?: string
          status?: string | null
          ticketing_mode?: string
          timezone?: string
          title?: string
          updated_at?: string | null
          vertical_poster_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_page_id_fkey"
            columns: ["host_page_id"]
            isOneToOne: false
            referencedRelation: "host_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_slots: {
        Row: {
          amount_paid: number | null
          category_id: string | null
          city: string | null
          created_at: string | null
          ends_at: string
          event_id: string
          id: string
          is_paid: boolean | null
          priority: number | null
          slot_type: string
          starts_at: string
        }
        Insert: {
          amount_paid?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          ends_at: string
          event_id: string
          id?: string
          is_paid?: boolean | null
          priority?: number | null
          slot_type: string
          starts_at: string
        }
        Update: {
          amount_paid?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          ends_at?: string
          event_id?: string
          id?: string
          is_paid?: boolean | null
          priority?: number | null
          slot_type?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_slots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      host_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          host_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          host_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          host_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_follows_host_page_id_fkey"
            columns: ["host_page_id"]
            isOneToOne: false
            referencedRelation: "host_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      host_pages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_verified: boolean | null
          banner_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          display_name: string
          facebook_url: string | null
          follower_count: number | null
          host_type: string
          id: string
          instagram_handle: string | null
          is_approved: boolean | null
          kyc_documents: Json | null
          kyc_status: string | null
          logo_url: string | null
          organisation_name: string | null
          rating_avg: number | null
          rating_count: number | null
          razorpay_account_id: string | null
          razorpay_contact_id: string | null
          state: string | null
          tagline: string | null
          total_events_hosted: number | null
          total_revenue: number | null
          total_tickets_sold: number | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          youtube_url: string | null
          slug: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_verified?: boolean | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          facebook_url?: string | null
          follower_count?: number | null
          host_type: string
          id?: string
          instagram_handle?: string | null
          is_approved?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          logo_url?: string | null
          organisation_name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          razorpay_account_id?: string | null
          razorpay_contact_id?: string | null
          state?: string | null
          tagline?: string | null
          total_events_hosted?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
          slug?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_verified?: boolean | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          facebook_url?: string | null
          follower_count?: number | null
          host_type?: string
          id?: string
          instagram_handle?: string | null
          is_approved?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          logo_url?: string | null
          organisation_name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          razorpay_account_id?: string | null
          razorpay_contact_id?: string | null
          state?: string | null
          tagline?: string | null
          total_events_hosted?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string
          country: string
          country_code: string | null
          created_at: string | null
          google_maps_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          place_id: string | null
          postal_code: string | null
          state: string | null
          venue_name: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city: string
          country: string
          country_code?: string | null
          created_at?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_id?: string | null
          postal_code?: string | null
          state?: string | null
          venue_name?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string
          country?: string
          country_code?: string | null
          created_at?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_id?: string | null
          postal_code?: string | null
          state?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_deleted_by_receiver: boolean | null
          is_deleted_by_sender: boolean | null
          is_read: boolean | null
          media_url: string | null
          message_type: string | null
          read_at: string | null
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          channel: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          read_at: string | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string | null
          currency: string | null
          event_id: string | null
          failure_reason: string | null
          gross_amount: number
          gst_on_fee: number | null
          host_id: string
          id: string
          initiated_at: string | null
          net_amount: number
          paid_at: string | null
          payout_type: string | null
          platform_fee: number
          razorpay_fund_account_id: string | null
          razorpay_payout_id: string | null
          status: string | null
          updated_at: string | null
          utr_number: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          failure_reason?: string | null
          gross_amount: number
          gst_on_fee?: number | null
          host_id: string
          id?: string
          initiated_at?: string | null
          net_amount: number
          paid_at?: string | null
          payout_type?: string | null
          platform_fee: number
          razorpay_fund_account_id?: string | null
          razorpay_payout_id?: string | null
          status?: string | null
          updated_at?: string | null
          utr_number?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          failure_reason?: string | null
          gross_amount?: number
          gst_on_fee?: number | null
          host_id?: string
          id?: string
          initiated_at?: string | null
          net_amount?: number
          paid_at?: string | null
          payout_type?: string | null
          platform_fee?: number
          razorpay_fund_account_id?: string | null
          razorpay_payout_id?: string | null
          status?: string | null
          updated_at?: string | null
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_platform_config_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_uses: {
        Row: {
          booking_id: string
          created_at: string | null
          discount_given: number
          id: string
          promo_code_id: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          discount_given: number
          id?: string
          promo_code_id: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          discount_given?: number
          id?: string
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          host_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string | null
          used_count: number | null
          uses_per_user: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          event_id?: string | null
          host_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          used_count?: number | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          used_count?: number | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          evidence_urls: Json | null
          id: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          evidence_urls?: Json | null
          id?: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          evidence_urls?: Json | null
          id?: string
          reason?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "event_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_enabled: boolean | null
          category_id: string | null
          city: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          id: string
          keyword: string | null
          label: string | null
          max_price: number | null
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          keyword?: string | null
          label?: string | null
          max_price?: number | null
          user_id: string
        }
        Update: {
          alert_enabled?: boolean | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          keyword?: string | null
          label?: string | null
          max_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          use_count?: number | null
        }
        Relationships: []
      }
      ticket_tiers: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          max_per_booking: number | null
          min_per_booking: number | null
          name: string
          perks: Json | null
          price: number
          reserved_count: number | null
          sale_end_at: string | null
          sale_start_at: string | null
          sold_count: number | null
          sort_order: number | null
          tier_type: string | null
          total_quantity: number
          updated_at: string | null
          tier_category: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          max_per_booking?: number | null
          min_per_booking?: number | null
          name: string
          perks?: Json | null
          price?: number
          reserved_count?: number | null
          sale_end_at?: string | null
          sale_start_at?: string | null
          sold_count?: number | null
          sort_order?: number | null
          tier_type?: string | null
          total_quantity: number
          updated_at?: string | null
          tier_category?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          max_per_booking?: number | null
          min_per_booking?: number | null
          name?: string
          perks?: Json | null
          price?: number
          reserved_count?: number | null
          sale_end_at?: string | null
          sale_start_at?: string | null
          sold_count?: number | null
          sort_order?: number | null
          tier_type?: string | null
          total_quantity?: number
          updated_at?: string | null
          tier_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          booking_item_id: string
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: string
          holder_email: string | null
          holder_name: string | null
          id: string
          is_checked_in: boolean | null
          is_void: boolean | null
          qr_code_data: string | null
          ticket_number: string
          voided_reason: string | null
        }
        Insert: {
          booking_id: string
          booking_item_id: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          is_checked_in?: boolean | null
          is_void?: boolean | null
          qr_code_data?: string | null
          ticket_number: string
          voided_reason?: string | null
        }
        Update: {
          booking_id?: string
          booking_item_id?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          is_checked_in?: boolean | null
          is_void?: boolean | null
          qr_code_data?: string | null
          ticket_number?: string
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_booking_item_id_fkey"
            columns: ["booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_oauth_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          provider: string
          provider_uid: string
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider: string
          provider_uid: string
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          provider_uid?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token_hash: string
          token_type: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token_hash: string
          token_type: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          token_type?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          ends_at: string
          host_page_id: string
          id: string
          plan_type: string
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          starts_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          ends_at: string
          host_page_id: string
          id?: string
          plan_type: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          ends_at?: string
          host_page_id?: string
          id?: string
          plan_type?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_host_page_id_fkey"
            columns: ["host_page_id"]
            isOneToOne: false
            referencedRelation: "host_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          anonymous_alias: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified_at: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          last_login_at: string | null
          login_count: number | null
          notification_prefs: Json | null
          password_hash: string | null
          phone: string | null
          phone_verified: boolean | null
          preferred_currency: string | null
          preferred_language: string | null
          privacy_settings: Json | null
          role: string | null
          suspended_until: string | null
          suspension_reason: string | null
          timezone: string | null
          updated_at: string | null
          username: string
          full_name: string | null
        }
        Insert: {
          anonymous_alias: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          notification_prefs?: Json | null
          password_hash?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          privacy_settings?: Json | null
          role?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          username: string
          full_name?: string | null
        }
        Update: {
          anonymous_alias?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          notification_prefs?: Json | null
          password_hash?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          privacy_settings?: Json | null
          role?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string
          full_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_events_public: {
        Row: {
          booking_count: number | null
          category_color: string | null
          category_name: string | null
          category_slug: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          end_datetime: string | null
          event_type: string | null
          fts: unknown
          host_display_name: string | null
          host_logo: string | null
          host_username: string | null
          id: string | null
          interests_count: number | null
          is_featured: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          max_price: number | null
          min_price: number | null
          short_description: string | null
          slug: string | null
          start_datetime: string | null
          state: string | null
          status: string | null
          ticketing_mode: string | null
          timezone: string | null
          title: string | null
          venue_name: string | null
          views_count: number | null
        }
        Relationships: []
      }
      v_ticket_availability: {
        Row: {
          available: number | null
          event_id: string | null
          is_sold_out: boolean | null
          reserved_count: number | null
          sold_count: number | null
          tier_id: string | null
          tier_name: string | null
          total_quantity: number | null
        }
        Insert: {
          available?: never
          event_id?: string | null
          is_sold_out?: never
          reserved_count?: number | null
          sold_count?: number | null
          tier_id?: string | null
          tier_name?: string | null
          total_quantity?: number | null
        }
        Update: {
          available?: never
          event_id?: string | null
          is_sold_out?: never
          reserved_count?: number | null
          sold_count?: number | null
          tier_id?: string | null
          tier_name?: string | null
          total_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_booking_atomic: {
        Args: {
          p_booking_id: string
          p_cancelled_by: string
          p_reason?: string
        }
        Returns: undefined
      }
      confirm_booking_payment_v2: {
        Args: {
          p_booking_id: string
          p_razorpay_method: string
          p_razorpay_payment_id: string
          p_razorpay_signature: string
        }
        Returns: {
          r_event_id: string
          r_ticket_id: string
          r_ticket_number: string
        }[]
      }
      increment_reserved_count: {
        Args: { increment_by: number; tier_id: string }
        Returns: undefined
      }
      join_waitlist_atomic: {
        Args: { p_event_id: string; p_tier_id: string; p_user_id: string }
        Returns: {
          r_position: number
          r_status: string
          r_was_already_on_list: boolean
        }[]
      }
      set_event_interest: {
        Args: { p_event_id: string; p_interest_type: string; p_user_id: string }
        Returns: Json
      }
      submit_event_review: {
        Args: {
          p_event_id: string
          p_rating: number
          p_rating_host?: number
          p_rating_value?: number
          p_rating_venue?: number
          p_review_text?: string
          p_title?: string
          p_user_id: string
        }
        Returns: Json
      }
      toggle_event_like: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
      toggle_event_save: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
      toggle_host_follow: {
        Args: { p_follower_id: string; p_host_id: string }
        Returns: Json
      }
      toggle_review_helpful: {
        Args: { p_review_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

