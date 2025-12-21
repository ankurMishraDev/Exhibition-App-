import { StorageUtils } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { ApiResponse, Booking, Event, Payment, Stall } from '@/types';

// Events API
export const EventsAPI = {
  // Get all published events
  getEvents: async (): Promise<ApiResponse<Event[]>> => {
    try {
      // Try to get from cache first
      const cachedEvents = StorageUtils.getCachedEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        return { data: cachedEvents };
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (error) {
        // Handle specific error types
        if (error.message.includes('schema cache') || error.message.includes('not found')) {
          return { 
            error: 'Database not set up. Please run migrations first.',
            message: 'The database schema is missing. Check the setup instructions in supabase/migrations/README.md'
          };
        }
        if (error.message.includes('JWSError') || error.message.includes('JWT')) {
          return { 
            error: 'Authentication error. Please check your Supabase credentials.',
            message: 'Invalid API key or expired session'
          };
        }
        return { 
          error: error.message,
          message: 'Unable to fetch events from database'
        };
      }

      // Handle empty response
      if (!data || data.length === 0) {
        return { 
          data: [],
          message: 'No published events available. Check back later!'
        };
      }

      // Cache the events
      StorageUtils.cacheEvents(data);

      return { data };
    } catch (error: any) {
      // Network or other errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return { 
          error: 'Network error. Please check your internet connection.',
          message: 'Unable to connect to server'
        };
      }
      return { 
        error: 'An unexpected error occurred',
        message: error.message || 'Please try again later'
      };
    }
  },

  // Get event by ID
  getEvent: async (eventId: string): Promise<ApiResponse<Event>> => {
    try {
      if (!eventId) {
        return { 
          error: 'Invalid event ID',
          message: 'Event ID is required'
        };
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('not found')) {
          return { 
            error: 'Database not set up',
            message: 'Please run database migrations'
          };
        }
        if (error.code === 'PGRST116') {
          return { 
            error: 'Event not found',
            message: 'This event may have been removed or is no longer available'
          };
        }
        return { error: error.message };
      }

      if (!data) {
        return { 
          error: 'Event not found',
          message: 'Unable to load event details'
        };
      }

      return { data };
    } catch (error: any) {
      return { 
        error: 'Failed to fetch event details',
        message: error.message || 'Please try again'
      };
    }
  },

  // Get event stalls with real-time updates
  getEventStalls: async (eventId: string): Promise<ApiResponse<Stall[]>> => {
    try {
      if (!eventId) {
        return { 
          error: 'Invalid event ID',
          message: 'Event ID is required to fetch stalls'
        };
      }

      const { data, error } = await supabase
        .from('stalls')
        .select('*')
        .eq('event_id', eventId)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });

      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('not found')) {
          return { 
            error: 'Database not set up',
            message: 'Stalls table is missing. Please run migrations.'
          };
        }
        return { 
          error: error.message,
          message: 'Unable to load stall information'
        };
      }

      if (!data || data.length === 0) {
        return { 
          data: [],
          message: 'No stalls available for this event'
        };
      }

      return { data };
    } catch (error: any) {
      return { 
        error: 'Failed to fetch event stalls',
        message: error.message || 'Please try again'
      };
    }
  },
};

// Bookings API
export const BookingsAPI = {
  // Get user bookings
  getUserBookings: async (userId: string): Promise<ApiResponse<Booking[]>> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events:event_id (*),
          stalls:stall_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch user bookings' };
    }
  },

  // Create booking (with optimistic locking)
  createBooking: async (booking: {
    event_id: string;
    stall_id: string;
    user_id: string;
    amount: number;
  }): Promise<ApiResponse<Booking>> => {
    try {
      // Start a transaction to prevent double booking
      const { data, error } = await supabase.rpc('create_booking_with_lock', {
        p_event_id: booking.event_id,
        p_stall_id: booking.stall_id,
        p_user_id: booking.user_id,
        p_amount: booking.amount,
      });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Failed to create booking' };
    }
  },

  // Update booking status
  updateBookingStatus: async (
    bookingId: string,
    status: Booking['status'],
    paymentStatus?: Booking['payment_status']
  ): Promise<ApiResponse<Booking>> => {
    try {
      const updateData: any = { status };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Failed to update booking' };
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        return { error: error.message };
      }

      return { data: true };
    } catch (error) {
      return { error: 'Failed to cancel booking' };
    }
  },
};

// Payments API
export const PaymentsAPI = {
  // Get user payment history
  getPaymentHistory: async (userId: string): Promise<ApiResponse<Payment[]>> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:booking_id (
            *,
            event:event_id (*),
            stall:stall_id (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch payment history' };
    }
  },

  // Create payment record
  createPayment: async (payment: {
    booking_id: string;
    user_id: string;
    amount: number;
    currency?: string;
    razorpay_order_id?: string;
  }): Promise<ApiResponse<Payment>> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          currency: payment.currency || 'INR',
          status: 'created',
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Failed to create payment record' };
    }
  },

  // Update payment status
  updatePaymentStatus: async (
    paymentId: string,
    status: Payment['status'],
    razorpayPaymentId?: string,
    method?: string
  ): Promise<ApiResponse<Payment>> => {
    try {
      const updateData: any = { status };
      if (razorpayPaymentId) {
        updateData.razorpay_payment_id = razorpayPaymentId;
      }
      if (method) {
        updateData.method = method;
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Failed to update payment status' };
    }
  },
};

// Real-time subscriptions
export const RealtimeAPI = {
  // Subscribe to stall updates for an event
  subscribeToStallUpdates: (eventId: string, callback: (stalls: Stall[]) => void) => {
    return supabase
      .channel(`stalls-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stalls',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Refetch stalls when there's a change
          EventsAPI.getEventStalls(eventId).then((result) => {
            if (result.data) {
              callback(result.data);
            }
          });
        }
      )
      .subscribe();
  },

  // Subscribe to booking updates for a user
  subscribeToBookingUpdates: (userId: string, callback: (bookings: Booking[]) => void) => {
    return supabase
      .channel(`bookings-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch bookings when there's a change
          BookingsAPI.getUserBookings(userId).then((result) => {
            if (result.data) {
              callback(result.data);
            }
          });
        }
      )
      .subscribe();
  },
};

// Export all APIs
export const API = {
  Events: EventsAPI,
  Bookings: BookingsAPI,
  Payments: PaymentsAPI,
  Realtime: RealtimeAPI,
};