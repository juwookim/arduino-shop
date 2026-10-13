// Supabase MCP generate_typescript_types 로 생성한 타입 (헬퍼 제네릭은 필요한 것만 남김)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: number
          order_id: string
          product_id: number | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: never
          order_id: string
          product_id?: number | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: never
          order_id?: string
          product_id?: number | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address1: string
          address2: string | null
          created_at: string
          id: string
          items_amount: number
          memo: string | null
          order_name: string
          order_number: string
          paid_at: string | null
          payment_key: string | null
          payment_method: string | null
          phone: string
          recipient: string
          shipping_fee: number
          status: string
          total_amount: number
          user_id: string | null
          zipcode: string | null
        }
        Insert: {
          address1: string
          address2?: string | null
          created_at?: string
          id?: string
          items_amount: number
          memo?: string | null
          order_name: string
          order_number: string
          paid_at?: string | null
          payment_key?: string | null
          payment_method?: string | null
          phone: string
          recipient: string
          shipping_fee: number
          status?: string
          total_amount: number
          user_id?: string | null
          zipcode?: string | null
        }
        Update: {
          address1?: string
          address2?: string | null
          created_at?: string
          id?: string
          items_amount?: number
          memo?: string | null
          order_name?: string
          order_number?: string
          paid_at?: string | null
          payment_key?: string | null
          payment_method?: string | null
          phone?: string
          recipient?: string
          shipping_fee?: number
          status?: string
          total_amount?: number
          user_id?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          sku: string | null
          slug: string
          source_url: string | null
          specs: Json
          stock: number
          summary: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price: number
          sku?: string | null
          slug: string
          source_url?: string | null
          specs?: Json
          stock?: number
          summary?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          source_url?: string | null
          specs?: Json
          stock?: number
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_order_payment: {
        Args: {
          p_amount: number
          p_method: string
          p_order_number: string
          p_payment_key: string
        }
        Returns: boolean
      }
      create_order: {
        Args: {
          p_address1: string
          p_address2: string
          p_items: Json
          p_memo: string
          p_phone: string
          p_recipient: string
          p_zipcode: string
        }
        Returns: {
          order_id: string
          order_name: string
          order_number: string
          total_amount: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
