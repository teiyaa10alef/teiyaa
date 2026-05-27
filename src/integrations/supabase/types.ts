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
          whatsapp: string | null
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
          whatsapp?: string | null
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
          whatsapp?: string | null
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
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          professional_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          professional_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          professional_id?: string
          sort_order?: number
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
          updated_at: string
          user_id: string
          whatsapp: string | null
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
          updated_at?: string
          user_id: string
          whatsapp?: string | null
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
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
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
      [_ in never]: never
    }
    Enums: {
      listing_category: "comercio" | "servico" | "imovel" | "freelance" | "vaga"
      listing_status: "active" | "paused" | "archived"
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
      listing_category: ["comercio", "servico", "imovel", "freelance", "vaga"],
      listing_status: ["active", "paused", "archived"],
    },
  },
} as const
