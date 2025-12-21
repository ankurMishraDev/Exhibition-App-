export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  total_stalls: number;
  available_stalls: number;
  price_per_stall: number;
  created_at: string;
  updated_at: string;
}

export interface Stall {
  id: string;
  event_id: string;
  stall_number: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  status: 'available' | 'reserved' | 'booked' | 'disabled';
  price: number;
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  event_id: string;
  stall_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  amount: number;
  booking_date: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  event?: Event;
  stall?: Stall;
  user?: User;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  amount: number;
  currency: string;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  method?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  booking?: Booking;
}

// Seat Map Types for Skia Component
export interface SeatMapDimensions {
  width: number;
  height: number;
  padding: number;
}

export interface SeatPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  stallId: string;
  stallNumber: string;
  status: Stall['status'];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface BookingForm {
  event_id: string;
  stall_id: string;
  user_notes?: string;
}

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'modal': undefined;
  'event/[id]': { id: string };
  'booking/[eventId]': { eventId: string };
};

export type TabParamList = {
  'index': undefined;
  'bookings': undefined;
  'history': undefined;
  'profile': undefined;
};