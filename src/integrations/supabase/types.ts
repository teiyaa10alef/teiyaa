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
      business_favorites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          closes_at: string | null
          id: string
          is_closed: boolean
          opens_at: string | null
          weekday: number
        }
        Insert: {
          business_id: string
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          weekday: number
        }
        Update: {
          business_id?: string
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_media: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          sort_order: number
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          sort_order?: number
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_promotions: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_label: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_label?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_label?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          price_cents: number | null
          sort_order: number
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          price_cents?: number | null
          sort_order?: number
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          price_cents?: number | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          category: string | null
          community_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          is_published: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          updated_at: string
          view_count: number
          whatsapp: string | null
          whatsapp_click_count: number
        }
        Insert: {
          address?: string | null
          category?: string | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          updated_at?: string
          view_count?: number
          whatsapp?: string | null
          whatsapp_click_count?: number
        }
        Update: {
          address?: string | null
          category?: string | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          view_count?: number
          whatsapp?: string | null
          whatsapp_click_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "businesses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          state_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          state_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          city_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          city_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          city_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_applications: {
        Row: {
          applicant_id: string
          available_at: string | null
          created_at: string
          gig_id: string
          id: string
          message: string | null
          proposed_cents: number | null
          status: Database["public"]["Enums"]["gig_application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          available_at?: string | null
          created_at?: string
          gig_id: string
          id?: string
          message?: string | null
          proposed_cents?: number | null
          status?: Database["public"]["Enums"]["gig_application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          available_at?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          message?: string | null
          proposed_cents?: number | null
          status?: Database["public"]["Enums"]["gig_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_conversations: {
        Row: {
          applicant_id: string
          application_id: string | null
          created_at: string
          gig_id: string
          id: string
          last_message_at: string
          owner_id: string
        }
        Insert: {
          applicant_id: string
          application_id?: string | null
          created_at?: string
          gig_id: string
          id?: string
          last_message_at?: string
          owner_id: string
        }
        Update: {
          applicant_id?: string
          application_id?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          last_message_at?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "gig_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_conversations_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "gig_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_reviews: {
        Row: {
          comment: string | null
          created_at: string
          gig_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          role: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          gig_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_reviews_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          address_hint: string | null
          applications_count: number
          assigned_user_id: string | null
          budget_cents: number | null
          budget_type: Database["public"]["Enums"]["gig_budget_type"]
          category: string
          community_id: string | null
          created_at: string
          description: string
          duration_hours: number | null
          id: string
          images: Json
          is_negotiable: boolean
          is_urgent: boolean
          owner_id: string
          requirements: string[]
          scheduled_date: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          address_hint?: string | null
          applications_count?: number
          assigned_user_id?: string | null
          budget_cents?: number | null
          budget_type?: Database["public"]["Enums"]["gig_budget_type"]
          category?: string
          community_id?: string | null
          created_at?: string
          description: string
          duration_hours?: number | null
          id?: string
          images?: Json
          is_negotiable?: boolean
          is_urgent?: boolean
          owner_id: string
          requirements?: string[]
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          address_hint?: string | null
          applications_count?: number
          assigned_user_id?: string | null
          budget_cents?: number | null
          budget_type?: Database["public"]["Enums"]["gig_budget_type"]
          category?: string
          community_id?: string | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          id?: string
          images?: Json
          is_negotiable?: boolean
          is_urgent?: boolean
          owner_id?: string
          requirements?: string[]
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "gigs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: Database["public"]["Enums"]["listing_category"]
          community_id: string
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string
          id: string
          images: Json
          owner_id: string
          price_cents: number | null
          status: Database["public"]["Enums"]["listing_status"]
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["listing_category"]
          community_id: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description: string
          id?: string
          images?: Json
          owner_id: string
          price_cents?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["listing_category"]
          community_id?: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: Json
          owner_id?: string
          price_cents?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          item_id: string
          last_message_at: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          item_id: string
          last_message_at?: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          item_id?: string
          last_message_at?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
        ]
      }
      market_items: {
        Row: {
          category: string
          community_id: string | null
          condition: Database["public"]["Enums"]["market_condition"]
          created_at: string
          description: string
          id: string
          images: Json
          is_negotiable: boolean
          price_cents: number | null
          seller_id: string
          status: Database["public"]["Enums"]["market_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          community_id?: string | null
          condition?: Database["public"]["Enums"]["market_condition"]
          created_at?: string
          description?: string
          id?: string
          images?: Json
          is_negotiable?: boolean
          price_cents?: number | null
          seller_id: string
          status?: Database["public"]["Enums"]["market_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          community_id?: string | null
          condition?: Database["public"]["Enums"]["market_condition"]
          created_at?: string
          description?: string
          id?: string
          images?: Json
          is_negotiable?: boolean
          price_cents?: number | null
          seller_id?: string
          status?: Database["public"]["Enums"]["market_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_items_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "market_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_offers: {
        Row: {
          amount_cents: number
          buyer_id: string
          created_at: string
          id: string
          item_id: string
          message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          created_at?: string
          id?: string
          item_id: string
          message?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          created_at?: string
          id?: string
          item_id?: string
          message?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_offers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          id: string
          link_path: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          link_path?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          link_path?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_cover: boolean
          media_type: string
          media_url: string
          professional_id: string
          sort_order: number
          title: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          media_type?: string
          media_url: string
          professional_id: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          media_type?: string
          media_url?: string
          professional_id?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_leads: {
        Row: {
          budget_cents: number | null
          contact_whatsapp: string | null
          created_at: string
          description: string
          id: string
          professional_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          contact_whatsapp?: string | null
          created_at?: string
          description: string
          id?: string
          professional_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string
          id?: string
          professional_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          community_id: string | null
          cover_url: string | null
          created_at: string
          headline: string | null
          id: string
          instagram: string | null
          is_published: boolean
          phone: string | null
          profession: string
          service_area_km: number | null
          specialties: string[]
          updated_at: string
          user_id: string
          view_count: number
          whatsapp: string | null
          whatsapp_click_count: number
          years_experience: number | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          phone?: string | null
          profession: string
          service_area_km?: number | null
          specialties?: string[]
          updated_at?: string
          user_id: string
          view_count?: number
          whatsapp?: string | null
          whatsapp_click_count?: number
          years_experience?: number | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          phone?: string | null
          profession?: string
          service_area_km?: number | null
          specialties?: string[]
          updated_at?: string
          user_id?: string
          view_count?: number
          whatsapp?: string | null
          whatsapp_click_count?: number
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          price_from_cents: number | null
          price_unit: string | null
          professional_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          price_from_cents?: number | null
          price_unit?: string | null
          professional_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          price_from_cents?: number | null
          price_unit?: string | null
          professional_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_business: boolean
          is_professional: boolean
          phone: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_business?: boolean
          is_professional?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_business?: boolean
          is_professional?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      states: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_business_view: {
        Args: { _business_id: string }
        Returns: undefined
      }
      increment_business_whatsapp_click: {
        Args: { _business_id: string }
        Returns: undefined
      }
      increment_gig_view: { Args: { _gig_id: string }; Returns: undefined }
      increment_professional_view: {
        Args: { _professional_id: string }
        Returns: undefined
      }
      increment_professional_whatsapp_click: {
        Args: { _professional_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_gig_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_gig_owner: {
        Args: { _gig_id: string; _user_id: string }
        Returns: boolean
      }
      push_notification: {
        Args: {
          _body: string
          _entity_id: string
          _link_path: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      gig_application_status:
        | "sent"
        | "seen"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "withdrawn"
      gig_budget_type: "fixed" | "hourly" | "negotiable"
      gig_status: "open" | "in_progress" | "completed" | "cancelled"
      listing_category: "comercio" | "servico" | "imovel" | "freelance" | "vaga"
      listing_status: "active" | "paused" | "archived"
      market_condition: "novo" | "seminovo" | "usado"
      market_status: "active" | "reserved" | "sold" | "paused"
      offer_status: "pending" | "accepted" | "rejected"
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
      gig_application_status: [
        "sent",
        "seen",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      gig_budget_type: ["fixed", "hourly", "negotiable"],
      gig_status: ["open", "in_progress", "completed", "cancelled"],
      listing_category: ["comercio", "servico", "imovel", "freelance", "vaga"],
      listing_status: ["active", "paused", "archived"],
      market_condition: ["novo", "seminovo", "usado"],
      market_status: ["active", "reserved", "sold", "paused"],
      offer_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
