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

### Step 3: Create Demo User Accounts

Use the mobile app to create these test accounts:

**Demo User 1:**
- Email: `demo1@example.com`
- Password: `Demo@123456`
- Name: Rajesh Kumar
- Phone: +91 98765 43210

**Demo User 2:**
- Email: `demo2@example.com`
- Password: `Demo@123456`
- Name: Priya Sharma
- Phone: +91 98765 43211

**Admin Account:**
- Email: `admin@exhibitionapp.com`
- Password: `Admin@123456`
- Name: Exhibition Admin

### Step 4: Verify Setup

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

## Database Schema Overview

### Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | Extended user information | Auto-created on signup, stores name/phone/avatar |
| **events** | Exhibition events | Status workflow, auto-calculated available_stalls |
| **stalls** | Individual booth/stall positions | Grid positioning (x,y), status tracking, features array |
| **bookings** | User stall reservations | Expiration time, payment linking, status workflow |
| **payments** | Payment transactions | Razorpay integration, webhook updates |

### Key Features

**Atomic Booking Creation**
- `create_booking_with_lock()` RPC function prevents double-booking
- Uses row-level locks for concurrency safety
- Auto-reserves stall and sets 15-minute expiration

**Auto-Expiring Bookings**
- `cancel_expired_bookings()` cleans up unpaid bookings
- Frees stalls automatically after timeout
- Can be called via CRON job or manually

**Real-time Updates**
- All tables support Supabase Realtime subscriptions
- Mobile app gets instant stall availability updates
- Admin dashboard sees live booking changes

**Storage Integration**
- `event-images` bucket for event photos
- Public read access for fast loading
- Authenticated upload/update/delete

## RLS Security Model

- **Public**: Can view published events and their stalls
- **Authenticated Users**: Can create bookings, view own data
- **Service Role** (Admin): Full access via admin dashboard

## Next Steps

1. ✅ Database schema created
2. ✅ Demo data seeded
3. 🔄 Mobile app connected to real API (in progress)
4. ⏳ Admin dashboard development
5. ⏳ Razorpay payment integration

## Troubleshooting

**Error: relation "profiles" already exists**
- Tables already created, skip to Step 2

**Error: RLS policy already exists**
- Policies already exist, safe to ignore

**No stalls showing in app**
- Check event status is 'published' in database
- Verify RLS policies allow public read access

**Storage bucket errors**
- Ensure `event-images` bucket exists in Storage tab
- Check RLS policies on storage.objects table

## Support

For issues or questions:
- Check Supabase logs in Dashboard > Logs
- Review RLS policies in Table Editor > Policies
- Test API calls in SQL Editor
