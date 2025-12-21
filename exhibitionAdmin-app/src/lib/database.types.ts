export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          start_date: string
          end_date: string
          image_url: string | null
          status: 'draft' | 'published' | 'ongoing' | 'completed'
          total_stalls: number
          available_stalls: number
          price_per_stall: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          start_date: string
          end_date: string
          image_url?: string | null
          status?: 'draft' | 'published' | 'ongoing' | 'completed'
          total_stalls?: number
          available_stalls?: number
          price_per_stall: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          start_date?: string
          end_date?: string
          image_url?: string | null
          status?: 'draft' | 'published' | 'ongoing' | 'completed'
          total_stalls?: number
          available_stalls?: number
          price_per_stall?: number
          updated_at?: string
        }
      }
      stalls: {
        Row: {
          id: string
          event_id: string
          stall_number: string
          position_x: number
          position_y: number
          width: number
          height: number
          status: 'available' | 'reserved' | 'booked' | 'disabled'
          price: number
          features: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          stall_number: string
          position_x: number
          position_y: number
          width?: number
          height?: number
          status?: 'available' | 'reserved' | 'booked' | 'disabled'
          price: number
          features?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          stall_number?: string
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          status?: 'available' | 'reserved' | 'booked' | 'disabled'
          price?: number
          features?: string[] | null
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          stall_id: string
          user_id: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id: string | null
          amount: number
          booking_date: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          stall_id: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id?: string | null
          amount: number
          booking_date?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          stall_id?: string
          user_id?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id?: string | null
          amount?: number
          booking_date?: string
          expires_at?: string | null
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          amount: number
          currency: string
          status: 'created' | 'captured' | 'failed' | 'refunded'
          method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          amount: number
          currency?: string
          status?: 'created' | 'captured' | 'failed' | 'refunded'
          method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          amount?: number
          currency?: string
          status?: 'created' | 'captured' | 'failed' | 'refunded'
          method?: string | null
          updated_at?: string
        }
      }
    }
  }
}
