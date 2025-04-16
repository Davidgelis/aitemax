export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_models: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          limitations: string[] | null
          name: string
          provider: string | null
          strengths: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          limitations?: string[] | null
          name: string
          provider?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          limitations?: string[] | null
          name?: string
          provider?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      prompt_drafts: {
        Row: {
          created_at: string
          current_step: number | null
          id: string
          is_deleted: boolean | null
          is_private: boolean | null
          master_command: string | null
          primary_toggle: string | null
          prompt_text: string | null
          secondary_toggle: string | null
          title: string | null
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          id?: string
          is_deleted?: boolean | null
          is_private?: boolean | null
          master_command?: string | null
          primary_toggle?: string | null
          prompt_text?: string | null
          secondary_toggle?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          current_step?: number | null
          id?: string
          is_deleted?: boolean | null
          is_private?: boolean | null
          master_command?: string | null
          primary_toggle?: string | null
          prompt_text?: string | null
          secondary_toggle?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          max_chars: number | null
          pillars: Json
          system_prefix: string | null
          temperature: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          max_chars?: number | null
          pillars?: Json
          system_prefix?: string | null
          temperature?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          max_chars?: number | null
          pillars?: Json
          system_prefix?: string | null
          temperature?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          current_step: number | null
          id: string
          is_draft: boolean | null
          is_private: boolean | null
          json_structure: Json | null
          master_command: string | null
          primary_toggle: string | null
          prompt_text: string | null
          saved_variables: Json | null
          secondary_toggle: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_draft?: boolean | null
          is_private?: boolean | null
          json_structure?: Json | null
          master_command?: string | null
          primary_toggle?: string | null
          prompt_text?: string | null
          saved_variables?: Json | null
          secondary_toggle?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_draft?: boolean | null
          is_private?: boolean | null
          json_structure?: Json | null
          master_command?: string | null
          primary_toggle?: string | null
          prompt_text?: string | null
          saved_variables?: Json | null
          secondary_toggle?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          completion_cost: number
          completion_tokens: number
          created_at: string
          id: string
          model: string
          prompt_cost: number
          prompt_id: string | null
          prompt_tokens: number
          step: number
          total_cost: number
          user_id: string
        }
        Insert: {
          completion_cost?: number
          completion_tokens?: number
          created_at?: string
          id?: string
          model: string
          prompt_cost?: number
          prompt_id?: string | null
          prompt_tokens?: number
          step: number
          total_cost?: number
          user_id: string
        }
        Update: {
          completion_cost?: number
          completion_tokens?: number
          created_at?: string
          id?: string
          model?: string
          prompt_cost?: number
          prompt_id?: string | null
          prompt_tokens?: number
          step?: number
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      x_templates: {
        Row: {
          character_limit: number
          created_at: string
          id: string
          is_default: boolean
          name: string
          pillars: Json
          role: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          character_limit?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          pillars?: Json
          role: string
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          character_limit?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          pillars?: Json
          role?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_token_summary: {
        Row: {
          total_completion_cost: number | null
          total_completion_tokens: number | null
          total_cost: number | null
          total_prompt_cost: number | null
          total_prompt_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
