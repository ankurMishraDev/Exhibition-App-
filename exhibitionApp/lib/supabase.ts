import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rihbalxthmgpxzsuogux.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJhbHh0aG1ncHh6c3VvZ3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjg1MTYsImV4cCI6MjA3OTkwNDUxNn0.EO64xzaB1LbKk208k7QR9uN4pDlaWFaducuW0Vd8IxY';

// Custom storage for web platform
const webStorage = {
  getItem: async (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          start_date: string;
          end_date: string;
          image_url: string | null;
          status: 'draft' | 'published' | 'ongoing' | 'completed';
          total_stalls: number;
          available_stalls: number;
          price_per_stall: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          start_date: string;
          end_date: string;
          image_url?: string | null;
          status?: 'draft' | 'published' | 'ongoing' | 'completed';
          total_stalls: number;
          available_stalls?: number;
          price_per_stall: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          start_date?: string;
          end_date?: string;
          image_url?: string | null;
          status?: 'draft' | 'published' | 'ongoing' | 'completed';
          total_stalls?: number;
          available_stalls?: number;
          price_per_stall?: number;
          updated_at?: string;
        };
      };
      stalls: {
        Row: {
          id: string;
          event_id: string;
          stall_number: string;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          status: 'available' | 'reserved' | 'booked' | 'disabled';
          price: number;
          features: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          stall_number: string;
          position_x: number;
          position_y: number;
          width?: number;
          height?: number;
          status?: 'available' | 'reserved' | 'booked' | 'disabled';
          price: number;
          features?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          stall_number?: string;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          status?: 'available' | 'reserved' | 'booked' | 'disabled';
          price?: number;
          features?: string[] | null;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          stall_id: string;
          user_id: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id: string | null;
          amount: number;
          booking_date: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          stall_id: string;
          user_id: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id?: string | null;
          amount: number;
          booking_date: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          stall_id?: string;
          user_id?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id?: string | null;
          amount?: number;
          booking_date?: string;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          razorpay_payment_id: string | null;
          razorpay_order_id: string | null;
          amount: number;
          currency: string;
          status: 'created' | 'captured' | 'failed' | 'refunded';
          method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          amount: number;
          currency?: string;
          status?: 'created' | 'captured' | 'failed' | 'refunded';
          method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          amount?: number;
          currency?: string;
          status?: 'created' | 'captured' | 'failed' | 'refunded';
          method?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}