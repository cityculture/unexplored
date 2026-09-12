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
    PostgrestVersion: "14.5"
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
      curation_reports: {
        Row: {
          created_at: string
          evidence_url: string | null
          event_id: string
          id: string
          message: string
          organization_name: string | null
          report_type: string
          reporter_email: string
          reporter_name: string
          reporter_phone: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          event_id: string
          id?: string
          message: string
          organization_name?: string | null
          report_type: string
          reporter_email: string
          reporter_name: string
          reporter_phone?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          event_id?: string
          id?: string
          message?: string
          organization_name?: string | null
          report_type?: string
          reporter_email?: string
          reporter_name?: string
          reporter_phone?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "curation_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string
          submission_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string
          submission_type?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string
          submission_type?: string
        }
        Relationships: []
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
      event_age_restrictions: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          min_age: number | null
          restriction_text: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          min_age?: number | null
          restriction_text: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          min_age?: number | null
          restriction_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_age_restrictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_age_restrictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_public"
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
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string | null
          creation_fee_paid: boolean | null
          creation_fee_payment_id: string | null
          description: string | null
          doors_open_at: string | null
          end_datetime: string
          event_type: string | null
          external_event_id: string | null
          external_source: string | null
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
          vertical_poster_alt: string | null
          vertical_poster_url: string | null
          views_count: number | null
          is_curated?: boolean | null
          source_platform?: string | null
          source_event_url?: string | null
          claim_status?: string | null
          claimed_by_user_id?: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creation_fee_paid?: boolean | null
          creation_fee_payment_id?: string | null
          description?: string | null
          doors_open_at?: string | null
          end_datetime: string
          event_type?: string | null
          external_event_id?: string | null
          external_source?: string | null
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
          vertical_poster_alt?: string | null
          vertical_poster_url?: string | null
          views_count?: number | null
          is_curated?: boolean | null
          source_platform?: string | null
          source_event_url?: string | null
          claim_status?: string | null
          claimed_by_user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creation_fee_paid?: boolean | null
          creation_fee_payment_id?: string | null
          description?: string | null
          doors_open_at?: string | null
          end_datetime?: string
          event_type?: string | null
          external_event_id?: string | null
          external_source?: string | null
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
          vertical_poster_alt?: string | null
          vertical_poster_url?: string | null
          views_count?: number | null
          is_curated?: boolean | null
          source_platform?: string | null
          source_event_url?: string | null
          claim_status?: string | null
          claimed_by_user_id?: string | null
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
      group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location_id: string | null
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      host_applications: {
        Row: {
          age: number
          agree_to_safety: boolean
          agree_to_terms: boolean
          agree_to_zero_harassment: boolean
          availability: string[]
          city: string
          created_at: string | null
          email: string
          event_formats: string[]
          events_attended: string
          full_name: string
          has_prior_experience: string
          id: string
          member_since: string
          occupation: string | null
          phone: string
          prior_experience_detail: string | null
          safety_understanding: string
          why_host: string
        }
        Insert: {
          age: number
          agree_to_safety?: boolean
          agree_to_terms?: boolean
          agree_to_zero_harassment?: boolean
          availability?: string[]
          city: string
          created_at?: string | null
          email: string
          event_formats?: string[]
          events_attended: string
          full_name: string
          has_prior_experience: string
          id?: string
          member_since: string
          occupation?: string | null
          phone: string
          prior_experience_detail?: string | null
          safety_understanding: string
          why_host: string
        }
        Update: {
          age?: number
          agree_to_safety?: boolean
          agree_to_terms?: boolean
          agree_to_zero_harassment?: boolean
          availability?: string[]
          city?: string
          created_at?: string | null
          email?: string
          event_formats?: string[]
          events_attended?: string
          full_name?: string
          has_prior_experience?: string
          id?: string
          member_since?: string
          occupation?: string | null
          phone?: string
          prior_experience_detail?: string | null
          safety_understanding?: string
          why_host?: string
        }
        Relationships: []
      }
      host_rating: {
        Row: {
          created_at: string | null
          host_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          host_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          host_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_rating_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_rating_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      host_reviews: {
        Row: {
          created_at: string | null
          host_id: string
          id: string
          is_approved: boolean | null
          review_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          host_id: string
          id?: string
          is_approved?: boolean | null
          review_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          host_id?: string
          id?: string
          is_approved?: boolean | null
          review_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_reviews_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_user_id_fkey"
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
      subscription_discount_code_uses: {
        Row: {
          applied_at: string | null
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id: string
          original_amount: number
          razorpay_order_id: string | null
          razorpay_subscription_id: string | null
          user_id: string | null
          user_subscription_id: string
        }
        Insert: {
          applied_at?: string | null
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id?: string
          original_amount: number
          razorpay_order_id?: string | null
          razorpay_subscription_id?: string | null
          user_id?: string | null
          user_subscription_id: string
        }
        Update: {
          applied_at?: string | null
          discount_amount?: number
          discount_code_id?: string
          final_amount?: number
          id?: string
          original_amount?: number
          razorpay_order_id?: string | null
          razorpay_subscription_id?: string | null
          user_id?: string | null
          user_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_discount_code_uses_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "subscription_discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_discount_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_discount_code_uses_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_discount_codes: {
        Row: {
          applicable_plan_ids: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          duration_in_cycles: number | null
          duration_type: string
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          razorpay_offer_id: string | null
          updated_at: string | null
          used_count: number | null
          uses_per_user: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plan_ids?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          duration_in_cycles?: number | null
          duration_type?: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          razorpay_offer_id?: string | null
          updated_at?: string | null
          used_count?: number | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plan_ids?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          duration_in_cycles?: number | null
          duration_type?: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          razorpay_offer_id?: string | null
          updated_at?: string | null
          used_count?: number | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          amount_paid: number | null
          created_at: string | null
          currency: string | null
          ends_at: string
          expiry_date: string | null
          host_id: string | null
          id: string
          metadata: Json | null
          plan_type: string
          rate_limit_events: number | null
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          start_date: string | null
          starts_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at: string
          expiry_date?: string | null
          host_id?: string | null
          id?: string
          metadata?: Json | null
          plan_type: string
          rate_limit_events?: number | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          start_date?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at?: string
          expiry_date?: string | null
          host_id?: string | null
          id?: string
          metadata?: Json | null
          plan_type?: string
          rate_limit_events?: number | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          start_date?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          external_tier_id: string | null
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
          tier_category: string | null
          tier_type: string | null
          total_quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id: string
          external_tier_id?: string | null
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
          tier_category?: string | null
          tier_type?: string | null
          total_quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id?: string
          external_tier_id?: string | null
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
          tier_category?: string | null
          tier_type?: string | null
          total_quantity?: number
          updated_at?: string | null
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
      user_follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_follows_follower_id_fkey"
            columns: ["follower_id"]
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancel_reason: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          discount_code_id: string | null
          discount_duration_type: string | null
          email_verified_at: string | null
          id: string
          is_verified: boolean | null
          notes: Json | null
          original_amount: number | null
          plan_type: string | null
          razorpay_customer_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_plan_id: string | null
          razorpay_subscription_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_token: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          discount_duration_type?: string | null
          email_verified_at?: string | null
          id?: string
          is_verified?: boolean | null
          notes?: Json | null
          original_amount?: number | null
          plan_type?: string | null
          razorpay_customer_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          discount_duration_type?: string | null
          email_verified_at?: string | null
          id?: string
          is_verified?: boolean | null
          notes?: Json | null
          original_amount?: number | null
          plan_type?: string | null
          razorpay_customer_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "subscription_discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
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
      users: {
        Row: {
          avatar_url: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_account_verified: boolean | null
          bank_ifsc: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified_at: string | null
          facebook_url: string | null
          firebase_uid: string | null
          follower_count: number | null
          full_name: string | null
          gender: string | null
          group_uuid: string | null
          host_type: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          kyc_documents: Json | null
          kyc_status: string | null
          last_login_at: string | null
          login_count: number | null
          notification_prefs: Json | null
          organisation_name: string | null
          password_hash: string | null
          phone: string | null
          phone_verified: boolean | null
          preferred_currency: string | null
          preferred_language: string | null
          privacy_settings: Json | null
          razorpay_account_id: string | null
          role: string | null
          suspended_until: string | null
          suspension_reason: string | null
          timezone: string | null
          total_events_hosted: number | null
          twitter_handle: string | null
          updated_at: string | null
          username: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_verified?: boolean | null
          bank_ifsc?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified_at?: string | null
          facebook_url?: string | null
          firebase_uid?: string | null
          follower_count?: number | null
          full_name?: string | null
          gender?: string | null
          group_uuid?: string | null
          host_type?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_prefs?: Json | null
          organisation_name?: string | null
          password_hash?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          privacy_settings?: Json | null
          razorpay_account_id?: string | null
          role?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          total_events_hosted?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          username: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_verified?: boolean | null
          bank_ifsc?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified_at?: string | null
          facebook_url?: string | null
          firebase_uid?: string | null
          follower_count?: number | null
          full_name?: string | null
          gender?: string | null
          group_uuid?: string | null
          host_type?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_prefs?: Json | null
          organisation_name?: string | null
          password_hash?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          privacy_settings?: Json | null
          razorpay_account_id?: string | null
          role?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          total_events_hosted?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          username?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      venue_partners: {
        Row: {
          amenities: Json | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          rating_avg: number | null
          rating_count: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          amenities?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          amenities?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_partners_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_events_public: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          booking_count: number | null
          category_color: string | null
          category_name: string | null
          category_slug: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_datetime: string | null
          event_type: string | null
          fts: unknown
          google_maps_url: string | null
          host_display_name: string | null
          host_logo: string | null
          host_tagline: string | null
          host_username: string | null
          id: string | null
          interests_count: number | null
          is_featured: boolean | null
          is_recurring: boolean | null
          is_sold_out: boolean | null
          is_sponsored: boolean | null
          latitude: number | null
          likes_count: number | null
          location_id: string | null
          longitude: number | null
          max_capacity: number | null
          max_price: number | null
          meta_description: string | null
          meta_title: string | null
          min_price: number | null
          place_id: string | null
          postal_code: string | null
          remaining_spots: number | null
          short_description: string | null
          slug: string | null
          start_datetime: string | null
          state: string | null
          status: string | null
          ticketing_mode: string | null
          timezone: string | null
          title: string | null
          updated_at: string | null
          venue_name: string | null
          vertical_poster_url: string | null
          views_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ticket_availability: {
        Row: {
          available: number | null
          currency: string | null
          event_id: string | null
          is_sold_out: boolean | null
          price: number | null
          reserved_count: number | null
          sold_count: number | null
          tier_id: string | null
          tier_name: string | null
          tier_type: string | null
          total_quantity: number | null
        }
        Insert: {
          available?: never
          currency?: string | null
          event_id?: string | null
          is_sold_out?: never
          price?: number | null
          reserved_count?: number | null
          sold_count?: number | null
          tier_id?: string | null
          tier_name?: string | null
          tier_type?: string | null
          total_quantity?: number | null
        }
        Update: {
          available?: never
          currency?: string | null
          event_id?: string | null
          is_sold_out?: never
          price?: number | null
          reserved_count?: number | null
          sold_count?: number | null
          tier_id?: string | null
          tier_name?: string | null
          tier_type?: string | null
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
      confirm_booking_payment_v2:
        | {
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
        | {
            Args: {
              p_booking_id: string
              p_razorpay_method?: string
              p_razorpay_payment_id: string
              p_razorpay_signature: string
            }
            Returns: {
              r_event_id: string
              r_ticket_id: string
              r_ticket_number: string
            }[]
          }
      create_event_complex: {
        Args: {
          age_restrictions?: Json
          agenda?: Json
          cohosts?: Json
          event_data: Json
          faqs?: Json
          tags?: Json
          ticket_tiers?: Json
        }
        Returns: string
      }
      create_pending_booking_v2: {
        Args: {
          p_attendee_email: string
          p_attendee_name: string
          p_attendee_phone: string
          p_discount_amount?: number
          p_event_id: string
          p_items?: Json
          p_razorpay_order_id?: string
          p_subtotal: number
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      increment_reserved_count: {
        Args: { increment_by: number; tier_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      join_waitlist_atomic: {
        Args: { p_event_id: string; p_tier_id: string; p_user_id: string }
        Returns: {
          r_position: number
          r_status: string
          r_was_already_on_list: boolean
        }[]
      }
      provision_host_auth_user: {
        Args: { target_email: string; target_id: string }
        Returns: undefined
      }
      release_expired_locks_for_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      set_event_interest: {
        Args: { p_event_id: string; p_interest_type: string; p_user_id: string }
        Returns: Json
      }
      slugify: { Args: { value: string }; Returns: string }
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
      sync_host_auth_id: {
        Args: { target_email: string; target_id: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
