# Exhibition Booking App - Database Setup

## Quick Start

### Step 1: Run Schema Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rihbalxthmgpxzsuogux
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `01_schema.sql`
5. Click **Run** to execute

This will create:
- ✅ All database tables (profiles, events, stalls, bookings, payments)
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamp updates
- ✅ Storage bucket for event images
- ✅ RPC functions for atomic booking operations

### Step 2: Run Seed Data

1. In the SQL Editor, create another **New Query**
2. Copy and paste the entire contents of `02_seed_data.sql`
3. Click **Run** to execute

This will populate:
- ✅ 5 demo events (Tech Expo, Startup Showcase, Green Energy Summit, etc.)
- ✅ 650 stalls across all events with realistic layouts
- ✅ Pricing tiers (premium corner stalls, front row, regular)

### Step 3: Verify Setup

Run these verification queries in the SQL Editor:

```sql
-- Check events
SELECT title, status, total_stalls, available_stalls 
FROM events 
ORDER BY start_date;

-- Check stalls per event
SELECT 
  e.title,
  COUNT(s.id) as total_stalls,
  COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available
FROM events e
LEFT JOIN stalls s ON e.id = s.event_id
GROUP BY e.id, e.title;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'event-images';
```

## Troubleshooting

**Error: relation "profiles" already exists**
- Tables already created, skip to Step 2

**Error: RLS policy already exists**
- Policies already exist, safe to ignore

**No events showing in app**
- Check event status is 'published' in database
- Verify RLS policies allow public read access
- Check Supabase URL and ANON_KEY in .env file

**Storage bucket errors**
- Ensure `event-images` bucket exists in Storage tab
- Check RLS policies on storage.objects table

## Database Schema Overview

### Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | Extended user information | Auto-created on signup, stores name/phone/avatar |
| **events** | Exhibition events | Status workflow, auto-calculated available_stalls |
| **stalls** | Individual booth/stall positions | Grid positioning (x,y), status tracking, features array |
| **bookings** | User stall reservations | Expiration time, payment linking, status workflow |
| **payments** | Payment transactions | Razorpay integration, webhook updates |

### Key Functions

**create_booking_with_lock(event_id, stall_id, user_id, amount)**
- Atomically creates booking and reserves stall
- Uses row-level locks to prevent double-booking
- Sets 15-minute expiration timer

**cancel_expired_bookings()**
- Cancels unpaid bookings past expiration
- Frees reserved stalls automatically
- Can be called via CRON or manually

## Next Steps

After running migrations:

1. ✅ Restart your Expo dev server: `npm start`
2. ✅ Reload the mobile app
3. ✅ Events should now load successfully
4. ✅ Create a test user account in the app
5. ✅ Try booking a stall

## Support

For issues:
- Check Supabase logs in Dashboard > Logs
- Review RLS policies in Table Editor > Policies
- Verify .env configuration in React Native app
