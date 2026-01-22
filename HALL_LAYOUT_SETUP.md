# Hall Layout Implementation - Setup Instructions

## Database Setup

Run these SQL scripts in Supabase SQL Editor in order:

### 1. Update Schema (04_add_halls_support.sql)
```bash
# This adds hall_id, company_name, company_logo_url columns to stalls
# Creates halls table and storage bucket for exhibitor logos
```

### 2. Seed Hall Data (05_seed_halls_data.sql)
```bash
# This creates the 3 halls (H2, H3, H7) and generates all stalls
# Make sure you have an event in the events table first
```

## Mobile App Setup

### 1. Install Required Package

```bash
cd exhibitionApp
npm install @react-native-picker/picker
```

### 2. Files Created/Modified

**New Files:**
- `exhibitionApp/constants/hallLayouts.json` - Hall configuration
- `exhibitionApp/components/StallComponents.tsx` - Reusable stall cell components
- `exhibitionApp/components/HallLayouts.tsx` - Hall layout renderers (H2, H3, H7)
- `database/04_add_halls_support.sql` - Database migration
- `database/05_seed_halls_data.sql` - Hall and stall seed data

**Modified Files:**
- `exhibitionApp/app/booking/[eventId].tsx` - Added hall selector and new layout rendering
- `exhibitionApp/types/index.ts` - Updated Stall interface with hall_id, company_name, company_logo_url

### 3. Run the App

```bash
npm start
```

## Features Implemented

### ✅ Hall System
- 3 halls configured: H2 (Live Machine), H3 (Central Plaza), H7 (Premium Zone)
- Dropdown selector to switch between halls
- Each hall has unique layout type

### ✅ Layout Types
- **H2**: Double column with center walkway (36 stalls)
- **H3**: T-shape complex layout (45 stalls)  
- **H7**: U-shape with top row and center columns (68 stalls)

### ✅ Stall Features
- Grid-based positioning system
- Support for merged/combined stalls (3x width in H7)
- Different pricing for premium locations
- Visual walkway/courtyard areas

### ✅ Company Logos
- Database fields ready for exhibitor logos
- Stalls can display company logo when booked
- Storage bucket configured for logo uploads

### ✅ Real-time Updates
- Realtime subscription updated to sync company info
- Logo displays automatically when stall is booked

## Hall Layouts

### Hall H2 - Live Machine
```
[Left Column] [Walkway] [Right Column]
18 stalls      (green)   18 stalls
```

### Hall H3 - Central Plaza
```
[Left] [Walkway] [Center 3x7] [Walkway] [Right]
                + Bottom squares
```

### Hall H7 - Premium Zone
```
[Triple][Top Row x6][Triple]
[Left] [CL] [Walk] [CR] [Right]
With center stalls starting row 3
```

## Next Steps

### Admin Dashboard Integration
To enable logo uploads, add these features to admin dashboard:
1. View all bookings with stall assignments
2. Upload exhibitor logo for each booking
3. Update stall.company_name and stall.company_logo_url

### Future Enhancements
- Hall statistics display (available vs booked)
- Filter stalls by price range
- Search by stall number
- 3D preview mode
- Export hall layout as PDF

## Troubleshooting

### Picker not working?
Make sure you installed the package:
```bash
npm install @react-native-picker/picker
npx expo install @react-native-picker/picker
```

### Stalls not showing?
1. Check if database migrations ran successfully
2. Verify event_id in seed data matches your actual event
3. Check console logs for stall validation errors

### Hall selector empty?
- Ensure stalls have hall_id set (H2, H3, or H7)
- Check that seed data script completed successfully
