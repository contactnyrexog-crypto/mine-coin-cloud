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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      orders: {
        Row: {
          amount: number
          billing_address: string | null
          billing_email: string
          coupon_code: string | null
          created_at: string
          currency: string
          delivery: Json | null
          discount: number
          id: string
          paid_at: string | null
          payment_method: string
          plan_key: string
          plan_name: string
          plan_tier: string | null
          price_inr: number
          product_type: string
          proof_url: string | null
          reject_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_address?: string | null
          billing_email: string
          coupon_code?: string | null
          created_at?: string
          currency?: string
          delivery?: Json | null
          discount?: number
          id?: string
          paid_at?: string | null
          payment_method: string
          plan_key: string
          plan_name: string
          plan_tier?: string | null
          price_inr: number
          product_type: string
          proof_url?: string | null
          reject_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_address?: string | null
          billing_email?: string
          coupon_code?: string | null
          created_at?: string
          currency?: string
          delivery?: Json | null
          discount?: number
          id?: string
          paid_at?: string | null
          payment_method?: string
          plan_key?: string
          plan_name?: string
          plan_tier?: string | null
          price_inr?: number
          product_type?: string
          proof_url?: string | null
          reject_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_address: string | null
          billing_email: string | null
          coins: number
          cpu_percent: number
          created_at: string
          currency: string
          disk_gb: number
          email: string | null
          id: string
          joined_mentionhost: boolean
          joined_nethost: boolean
          last_afk_credit: string | null
          ram_mb: number
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_email?: string | null
          coins?: number
          cpu_percent?: number
          created_at?: string
          currency?: string
          disk_gb?: number
          email?: string | null
          id: string
          joined_mentionhost?: boolean
          joined_nethost?: boolean
          last_afk_credit?: string | null
          ram_mb?: number
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_email?: string | null
          coins?: number
          cpu_percent?: number
          created_at?: string
          currency?: string
          disk_gb?: number
          email?: string | null
          id?: string
          joined_mentionhost?: boolean
          joined_nethost?: boolean
          last_afk_credit?: string | null
          ram_mb?: number
          updated_at?: string
        }
        Relationships: []
      }
      redeem_codes: {
        Row: {
          active: boolean
          code: string
          coins: number
          cpu_percent: number
          created_at: string
          discount_inr: number
          discount_percent: number
          disk_gb: number
          id: string
          kind: string
          max_uses: number
          ram_mb: number
          updated_at: string
          used_count: number
          uses_per_user: number
        }
        Insert: {
          active?: boolean
          code: string
          coins?: number
          cpu_percent?: number
          created_at?: string
          discount_inr?: number
          discount_percent?: number
          disk_gb?: number
          id?: string
          kind: string
          max_uses?: number
          ram_mb?: number
          updated_at?: string
          used_count?: number
          uses_per_user?: number
        }
        Update: {
          active?: boolean
          code?: string
          coins?: number
          cpu_percent?: number
          created_at?: string
          discount_inr?: number
          discount_percent?: number
          disk_gb?: number
          id?: string
          kind?: string
          max_uses?: number
          ram_mb?: number
          updated_at?: string
          used_count?: number
          uses_per_user?: number
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          code_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "redeem_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          cpu_percent: number
          created_at: string
          disk_gb: number
          egg: string
          id: string
          name: string
          node_id: number
          node_name: string
          panel_server_id: string | null
          ram_mb: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpu_percent: number
          created_at?: string
          disk_gb: number
          egg: string
          id?: string
          name: string
          node_id: number
          node_name: string
          panel_server_id?: string | null
          ram_mb: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpu_percent?: number
          created_at?: string
          disk_gb?: number
          egg?: string
          id?: string
          name?: string
          node_id?: number
          node_name?: string
          panel_server_id?: string | null
          ram_mb?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
