# Booking System Documentation

## Overview
The booking system allows users to select and book exhibition stalls with integrated mock payment processing. This implementation uses Supabase for backend operations and includes real-time updates for multi-user scenarios.

## Features Implemented

### 1. **Stall Selection & Visualization**
- GPU-accelerated canvas rendering using @shopify/react-native-skia
- 150 stalls displayed in a 10×15 grid layout
- Color-coded status indicators:
  - 🟢 Green: Available
  - 🟠 Orange: Reserved
  - ⚫ Gray: Booked/Disabled
  - 🟣 Purple border: Currently selected
- Touch detection via individual TouchableOpacity overlays
- Haptic feedback on stall selection
- Horizontal + vertical scrolling for full stall map navigation

### 2. **Mock Payment Flow**
#### Payment Confirmation Modal
- Displays selected stall number and price
- Shows "🧪 Mock Payment Mode" notice
- "Process Payment" button with gradient styling
- Loading state during payment processing

#### Payment Processing
1. User selects available stall → Details card appears
2. Clicks "Proceed to Payment" → Payment modal opens
3. Clicks "Process Payment" → 2-second mock delay
4. Backend creates booking via `create_booking_with_lock()` RPC function
5. Creates payment record with `fake_pay_XXXXX` ID
6. Updates local stall status to "booked"
7. Shows success modal with booking details

#### Success Modal
- 🎉 Celebration icon
- Booking ID (first 8 characters, uppercase)
- Event name, stall number, amount paid
- "Done" button to close
- "View Bookings" button to navigate to bookings tab

### 3. **Database Integration**

#### RPC Function: `create_booking_with_lock`
```sql
CREATE OR REPLACE FUNCTION create_booking_with_lock(
  p_event_id UUID,
  p_stall_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS JSON
```
- Uses row-level locking (`FOR UPDATE NOWAIT`)
- Prevents double-booking race conditions
- Returns booking_id on success
- Throws error if stall already booked

#### Payment Record Structure
```typescript
{
  id: string;                        // fake_pay_1234567890
  booking_id: string;                // UUID from RPC response
  amount: number;                    // Stall price
  payment_method: 'mock';
  payment_status: 'completed';
  razorpay_payment_id: string;       // fake_pay_1234567890
  razorpay_order_id: string;         // fake_order_1234567890
  created_at: timestamp;
}
```

### 4. **Realtime Updates**

#### Stall Status Updates (Booking Screen)
```typescript
supabase.channel(`stalls-${eventId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stalls',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Updates stall colors in real-time
    // Clears selection if stall booked by another user
  })
```

#### New Bookings (Bookings Tab)
```typescript
supabase.channel('user-bookings')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookings',
    filter: `user_id=eq.${userId}`
  }, () => {
    // Refreshes booking list automatically
  })
```

#### New Payments (History Tab)
```typescript
supabase.channel('user-payments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'payments',
    filter: `user_id=eq.${userId}`
  }, () => {
    // Refreshes payment history automatically
  })
```

### 5. **User Interface Screens**

#### Booking Screen (`app/booking/[eventId].tsx`)
- Event header with gradient background
- Scrollable stall map with SkiaSeatMap component
- Selected stall details card
- Fixed bottom "Proceed to Payment" button
- Payment & Success modals

#### Bookings Tab (`app/(tabs)/bookings.tsx`)
- List of user's bookings with event details
- Status badges (confirmed/pending/cancelled)
- Event location, date, stall number
- Amount paid
- Pull-to-refresh functionality

#### History Tab (`app/(tabs)/history.tsx`)
- Payment transaction history
- Shows event name and stall number
- Payment status with color coding
- Transaction ID, payment method
- Total spent summary
- Successful payments count

## Technical Details

### Mock Payment Configuration
- **Processing Time**: 2 seconds (adjustable)
- **Success Rate**: 100% (always succeeds)
- **Payment Gateway**: Mock (no actual transaction)
- **Transaction ID Format**: `fake_pay_${Date.now()}`

### Security Features
- Row Level Security (RLS) on all tables
- User-specific data filtering
- Atomic booking operations with locking
- Session-based authentication via Supabase

### Error Handling
- Duplicate booking detection
- Network error recovery
- Real-time conflict resolution
- User-friendly error messages

## Future Enhancements (Planned)

### 1. Razorpay Integration
Replace mock payment with real Razorpay gateway:
```typescript
// Install: npm install react-native-razorpay
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  key: 'YOUR_RAZORPAY_KEY',
  amount: selectedStall.price * 100, // paise
  currency: 'INR',
  name: event.title,
  description: `Stall ${selectedStall.stall_number}`,
  prefill: {
    email: user.email,
    contact: user.phone,
    name: user.name
  }
};

RazorpayCheckout.open(options)
  .then((data) => {
    // Payment success - create booking
  })
  .catch((error) => {
    // Payment failed
  });
```

### 2. QR Code Generation
Add QR codes to bookings for event entry:
```typescript
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={JSON.stringify({
    bookingId: booking.id,
    eventId: booking.event_id,
    stallNumber: booking.stall.stall_number
  })}
  size={200}
/>
```

### 3. Booking Cancellation
Allow users to cancel bookings with refund processing

### 4. Booking Expiry
Auto-release stalls if payment not completed within time limit

### 5. Email Notifications
Send booking confirmation and receipt via email

## Testing the Mock Payment

1. **Start the app**: `npx expo start`
2. **Login**: Use test credentials from Supabase
3. **Navigate**: Home → Select Event → Book Stall
4. **Select Stall**: Tap any green (available) stall
5. **Proceed**: Click "Proceed to Payment"
6. **Confirm**: Click "Process Payment" in modal
7. **Wait**: 2-second processing animation
8. **Success**: View booking receipt
9. **Verify**: Check Bookings tab and History tab
10. **Real-time**: Open app on another device, book same event → See colors update

## Database Setup Required

Before testing, run migrations in Supabase Dashboard:

1. **Schema Migration**: Execute `supabase/migrations/01_schema.sql`
   - Creates tables: events, stalls, bookings, payments, profiles
   - Adds RLS policies
   - Creates `create_booking_with_lock()` function

2. **Seed Data**: Execute `supabase/migrations/02_seed_data.sql`
   - Adds 5 demo events
   - Adds 650 stalls across events
   - Tech Expo 2025 has 150 stalls ready for testing

## File Structure

```
components/
  BookingModals.tsx          # PaymentModal & SuccessModal
  SkiaSeatMap.tsx            # Canvas-based stall visualization

app/
  booking/[eventId].tsx      # Main booking screen
  (tabs)/
    bookings.tsx             # User's bookings list
    history.tsx              # Payment transaction history

lib/
  api.ts                     # API wrappers for Supabase
  supabase.ts                # Supabase client configuration

types/
  index.ts                   # TypeScript interfaces

supabase/
  migrations/
    01_schema.sql            # Database schema
    02_seed_data.sql         # Test data
```

## API Methods

```typescript
// Get event stalls
EventsAPI.getEventStalls(eventId) 
  → ApiResponse<Stall[]>

// Create booking
supabase.rpc('create_booking_with_lock', {...})
  → { booking_id: string, stall_id: string }

// Get user bookings
BookingsAPI.getUserBookings(userId)
  → ApiResponse<Booking[]>

// Get payment history
PaymentsAPI.getPaymentHistory(userId)
  → ApiResponse<Payment[]>
```

## Troubleshooting

**Stalls not visible?**
- Check database migrations executed
- Verify seed data inserted
- Check network connection

**Selection not working?**
- Ensure stall status is 'available'
- Check console logs for touch events
- Try different stall

**Payment fails?**
- Check user authentication
- Verify RPC function exists
- Check Supabase logs

**Real-time not updating?**
- Verify Realtime enabled in Supabase project
- Check channel subscriptions in console
- Ensure RLS policies allow reads

---

**Last Updated**: December 2024  
**Version**: 1.0 (Mock Payment)  
**Next Version**: 2.0 (Razorpay Integration)
