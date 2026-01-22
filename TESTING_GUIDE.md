# Testing Guide: Exhibitor Profile System

## ✅ Completed Features

### 1. Database Schema (06_exhibitor_profiles.sql)
- ✅ exhibitor_profiles table with company details
- ✅ Auto-completion trigger (sets is_completed flag)
- ✅ Immutable snapshot trigger (copies data to bookings.exhibitor_snapshot on confirmation)
- ✅ RLS policies for security
- ✅ RPC function: can_user_book_stall()

### 2. Exhibitor Profile Form
- ✅ File: components/ExhibitorDetailsForm.tsx
- ✅ Company name, domain, website fields
- ✅ Logo upload with expo-image-picker
- ✅ Executive name and designation
- ✅ Contact number with validation
- ✅ 14 industry domain options

### 3. Profile Screen Integration
- ✅ File: app/(tabs)/profile.tsx
- ✅ Exhibitor profile section with completion badge
- ✅ "Complete Profile" or "Edit" button
- ✅ Display company details when completed
- ✅ Navigation to exhibitor-details screen

### 4. Booking Validation
- ✅ File: app/booking/[eventId].tsx
- ✅ Check profile completion before payment
- ✅ Alert with navigation to profile form if incomplete
- ✅ Block booking until profile is completed

### 5. Stall Details Modal
- ✅ File: components/StallDetailsModal.tsx
- ✅ Display company logo, name, domain, website
- ✅ Show executive details and contact info
- ✅ Clickable phone number and website links
- ✅ Automatically shown when user clicks booked stall

### 6. Hall Layout Updates
- ✅ File: components/HallLayouts.tsx
- ✅ H7 layout centered with horizontal scroll
- ✅ Stall click handlers for booked stalls
- ✅ Company logos displayed on booked stalls

---

## 🧪 Testing Steps

### Test 1: Profile Completion Flow
1. **Login** to the app
2. **Navigate to Profile tab**
3. You should see **"🏢 Exhibitor Profile"** section
4. Status should show as **incomplete** with "Complete" button
5. **Click "Complete"** button
6. Fill in all required fields:
   - Company Name: "ABC Corp"
   - Domain: Select "Technology"
   - Website: "www.abccorp.com"
   - Contact Number: "+91 9876543210"
   - Executive Name: "John Doe"
   - Designation: "Sales Manager"
7. **Upload a logo** (optional but recommended)
8. **Click "Save Profile"**
9. Should navigate back to profile tab
10. **Verify**: Exhibitor section now shows "✓ Completed" badge

### Test 2: Booking Validation (Profile Incomplete)
1. **Clear your exhibitor profile** (or use a new account)
2. **Navigate to an event** and open booking page
3. **Select an available stall**
4. **Click "Proceed to Payment"**
5. **Expected**: Alert appears saying "Complete Your Profile"
6. **Click "Complete Profile"** in alert
7. **Expected**: Navigates to exhibitor-details form

### Test 3: Booking Validation (Profile Complete)
1. **Complete your exhibitor profile** (Test 1)
2. **Navigate to an event** and open booking page
3. **Select an available stall**
4. **Click "Proceed to Payment"**
5. **Expected**: Payment modal opens (no alert)
6. **Complete payment**
7. **Verify**: Stall shows your company logo

### Test 4: Viewing Booked Stall Details
1. **Find a stall that's already booked** (gray color)
2. **Click on the booked stall**
3. **Expected**: Modal opens showing:
   - Company logo (if uploaded)
   - Company name
   - Industry domain
   - Website (clickable)
   - Executive name and designation
   - Contact number (clickable to call)
4. **Test**: Click website link - opens in browser
5. **Test**: Click phone number - opens dialer
6. **Close modal** - continues browsing

### Test 5: Hall Layout Centering
1. **Navigate to booking page**
2. **Select "Hall H7"** from dropdown
3. **Expected**: Hall layout is centered on screen
4. **Test**: Scroll horizontally to see all stalls
5. **Verify**: Layout doesn't overflow to left

### Test 6: Profile Edit Flow
1. **Complete exhibitor profile**
2. **Go to Profile tab**
3. **Click "Edit"** button in exhibitor section
4. **Change company name** to "XYZ Industries"
5. **Save profile**
6. **Book a new stall**
7. **Verify**: New stall shows updated company name
8. **Check previous booking**: Should still show old name (immutable snapshot)

---

## 🔍 Database Verification

Run these queries in Supabase SQL Editor to verify data:

### Check Exhibitor Profile
```sql
SELECT * FROM exhibitor_profiles 
WHERE user_id = 'YOUR_USER_ID';
```

### Check Booking Snapshot
```sql
SELECT 
  b.id,
  b.exhibitor_snapshot,
  s.stall_number,
  s.company_name,
  s.company_logo_url
FROM bookings b
JOIN stalls s ON s.id = b.stall_id
WHERE b.user_id = 'YOUR_USER_ID'
  AND b.status = 'confirmed';
```

### Verify Stall Company Info
```sql
SELECT 
  stall_number,
  status,
  company_name,
  company_logo_url
FROM stalls
WHERE status = 'booked'
ORDER BY stall_number;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Profile not found" when booking
**Cause**: User hasn't completed exhibitor profile
**Solution**: Complete profile in Profile tab before booking

### Issue 2: Logo not displaying
**Cause**: Supabase storage permissions or image upload failed
**Solution**: 
- Check storage bucket "exhibitor-logos" exists
- Verify RLS policies allow public read
- Re-upload logo

### Issue 3: Modal not showing exhibitor details
**Cause**: Booking doesn't have exhibitor_snapshot
**Solution**: 
- Confirm booking was made AFTER completing profile
- Check booking status is 'confirmed'
- Verify exhibitor_snapshot column has data

### Issue 4: Can still book without profile
**Cause**: RPC function not working or not called
**Solution**:
- Verify 06_exhibitor_profiles.sql was run completely
- Check can_user_book_stall() function exists
- Test RPC directly: `SELECT can_user_book_stall('user_id');`

### Issue 5: H7 layout still left-aligned
**Cause**: Cache or component not re-rendered
**Solution**:
- Force refresh the app
- Clear Metro bundler cache: `npm start -- --reset-cache`

---

## 📊 Success Criteria

- [ ] User can complete exhibitor profile with all fields
- [ ] Logo uploads successfully to Supabase storage
- [ ] Profile tab shows completion status correctly
- [ ] Booking is blocked until profile completed
- [ ] Alert navigates to profile form
- [ ] Completed profile allows booking
- [ ] Company logo appears on booked stall
- [ ] Clicking booked stall opens details modal
- [ ] Website and phone links work in modal
- [ ] H7 layout is centered
- [ ] Profile edits don't affect old bookings (immutable)
- [ ] Multiple users can book stalls with their own logos

---

## 🎯 Next Steps (Future Enhancements)

1. **Email notifications** when profile is completed
2. **Admin dashboard** to view all exhibitor profiles
3. **Profile verification** by admin before booking
4. **Company description** and social media links
5. **Multiple executives** per company
6. **Document uploads** (brochures, certificates)
7. **Profile analytics** (views, clicks on website)
8. **QR code generation** for each exhibitor

---

## 📝 Notes

- Exhibitor profiles are **user-specific** (one profile per user)
- Booking snapshots are **immutable** (editing profile doesn't change old bookings)
- Logos are stored in Supabase Storage under "exhibitor-logos" bucket
- Profile completion is **automatic** based on required fields
- RPC function runs server-side for security (can't be bypassed)
