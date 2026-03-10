# 🚀 Quick Setup Guide - Exhibition Booking App

## ⚠️ Current Error

You're seeing this error because the database schema hasn't been set up yet:
```
ERROR: Could not find the table 'public.events' in the schema cache
```

## ✅ Solution (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/rihbalxthmgpxzsuogux
2. Log in to your Supabase account
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run Schema Migration

1. Click **+ New Query** button
2. Open the file: `supabase/migrations/01_schema.sql`
3. Copy ALL the contents (entire file)
4. Paste into the SQL Editor
5. Click **Run** button (or press Ctrl+Enter)

**What this does:**
- ✅ Creates 5 tables (profiles, events, stalls, bookings, payments)
- ✅ Sets up security policies (RLS)
- ✅ Creates functions for atomic bookings
- ✅ Sets up event images storage bucket

### Step 3: Add Demo Data

1. Click **+ New Query** again
2. Open the file: `supabase/migrations/02_seed_data.sql`
3. Copy ALL the contents
4. Paste into the SQL Editor
5. Click **Run**

**What this does:**
- ✅ Adds 5 demo events (Tech Expo, Startup Showcase, etc.)
- ✅ Creates 650 stalls across all events
- ✅ Sets realistic pricing (₹18,000 - ₹40,000)

### Step 4: Restart Your App

```powershell
# In your terminal, press Ctrl+C to stop, then:
npm start
```

Reload the app on your device/emulator - **events should now appear!**

---

## 🔍 Verify Setup (Optional)

Run this in SQL Editor to check:

```sql
-- Should show 5 events
SELECT title, status, total_stalls, available_stalls 
FROM events 
ORDER BY start_date;

-- Should show 650 total stalls
SELECT COUNT(*) as total_stalls FROM stalls;
```

---

## ❌ Troubleshooting

### Still seeing errors?

**Check 1: Verify Supabase credentials**
```
File: .env
EXPO_PUBLIC_SUPABASE_URL=https://rihbalxthmgpxzsuogux.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Check 2: Tables exist in Supabase**
- Go to **Table Editor** in Supabase Dashboard
- You should see: `events`, `stalls`, `profiles`, `bookings`, `payments`

**Check 3: RLS Policies are set**
- In Table Editor, click on `events` table
- Click **RLS Policies** tab
- Should see: "Anyone can view published events"

### Common Issues

**"Already exists" errors when running 01_schema.sql**
- Tables already created ✅
- Skip to Step 3 (seed data)

**No events showing after migration**
- Make sure you ran 02_seed_data.sql
- Check event status is 'published': `SELECT title, status FROM events;`

**Network/connection errors**
- Check internet connection
- Verify Supabase project is not paused (free tier auto-pauses after 1 week inactivity)

---

## 📚 Next Steps

Once setup is complete:

1. **Create test account** in the app
2. **Browse events** on home tab
3. **Select a stall** (try Tech Expo 2025)
4. **Test booking flow** (payment will be in test mode)

---

## 🆘 Need Help?

Check the detailed documentation:
- `supabase/migrations/README.md` - Full setup instructions
- `lib/api.ts` - API error handling
- `types/index.ts` - Database schema TypeScript types

**Pro Tip:** The app now shows helpful error messages with setup instructions if the database isn't configured!

---

*Setup time: ~5 minutes*
*Last updated: November 28, 2025*
