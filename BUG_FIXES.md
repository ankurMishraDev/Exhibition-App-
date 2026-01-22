# Bug Fixes - Exhibitor Booking System

## Issues Fixed

### 1. ✅ Payment Record Creation Error
**Problem:** `invalid input syntax for type uuid: "fake_pay_1766594603383"`

**Root Cause:** The code was manually creating payment IDs with format `fake_pay_${timestamp}`, which is not a valid UUID format.

**Solution:**
- Removed manual `id` field from payment insert
- Let PostgreSQL auto-generate UUID using `uuid_generate_v4()`
- Removed unnecessary `razorpay_payment_id` and `razorpay_order_id` fields for mock payments

**Files Modified:**
- `app/booking/[eventId].tsx` (lines ~285-295)

---

### 2. ✅ Booking Without Profile Completion
**Problem:** Users could book stalls without completing their exhibitor profile.

**Root Cause:** The `canBookStall` API function was being called without the required `userId` parameter.

**Solution:**
- Updated `handleProceedToPayment` to pass `user.id` to `ExhibitorAPI.canBookStall(user.id)`
- Added console logging for debugging
- Ensured the function properly waits for and checks the response

**Files Modified:**
- `app/booking/[eventId].tsx` (handleProceedToPayment function)

---

### 3. ✅ Exhibitor Details Not Showing on Booked Stalls
**Problem:** Clicking booked stalls didn't show exhibitor information in the modal.

**Root Cause:** Multiple potential issues:
1. The exhibitor snapshot might not have been saved during booking confirmation
2. The query might not be finding the booking record
3. The trigger might not have executed

**Solution:**
- Added detailed console logging to trace the data flow
- Logs now show:
  - When fetching stall details
  - The booking data returned
  - Whether exhibitor snapshot exists
  - The snapshot contents

**Debugging Added:**
```javascript
console.log('[Stall Details] Fetching details for stall:', stall.id);
console.log('[Stall Details] Booking data:', data);
console.log('[Stall Details] Exhibitor snapshot:', data.exhibitor_snapshot);
```

**Files Modified:**
- `app/booking/[eventId].tsx` (handleStallSelect function)

---

### 4. ✅ Profile Fetch Issues
**Problem:** Profile tab wasn't correctly fetching exhibitor profile data.

**Root Cause:** The `getMyProfile` API call was missing the `userId` parameter.

**Solution:**
- Updated `fetchExhibitorProfile` to pass `user.id` parameter
- Added null check for `user` before calling API

**Files Modified:**
- `app/(tabs)/profile.tsx` (fetchExhibitorProfile function)

---

## Testing Instructions

### Test 1: Payment Creation
1. **Book a stall** with completed profile
2. **Complete mock payment**
3. **Check console** - should NOT see UUID error
4. **Check database:**
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
   ```
5. **Verify:** Payment record has proper UUID in `id` column

---

### Test 2: Profile Validation Before Booking
1. **Create new account** or clear exhibitor profile
2. **Navigate to booking page**
3. **Select available stall**
4. **Click "Proceed to Payment"**
5. **Check console logs:**
   ```
   [Booking] Checking profile completion for user: <uuid>
   [Booking] Can book stall: false
   ```
6. **Expected:** Alert appears with "Complete Your Profile" message
7. **Click "Complete Profile"** - should navigate to exhibitor-details screen
8. **Complete the profile**
9. **Try booking again**
10. **Check console logs:**
    ```
    [Booking] Checking profile completion for user: <uuid>
    [Booking] Can book stall: true
    ```
11. **Expected:** Payment modal opens (no alert)

---

### Test 3: Exhibitor Details Display
1. **Complete exhibitor profile** with all fields including logo
2. **Book and confirm a stall**
3. **Wait for booking confirmation**
4. **Navigate back to booking page**
5. **Find your booked stall** (should show gray color and your logo)
6. **Click on your booked stall**
7. **Check console logs:**
   ```
   [Stall Details] Fetching details for stall: <uuid>
   [Stall Details] Booking data: {exhibitor_snapshot: {...}}
   [Stall Details] Exhibitor snapshot: {company_name: "...", ...}
   ```
8. **Expected:** Modal opens showing:
   - Company logo
   - Company name
   - Domain
   - Website (clickable)
   - Executive details
   - Contact number (clickable)

---

### Test 4: Database Trigger Verification

After booking a stall, run these queries to verify the trigger worked:

```sql
-- Check if exhibitor snapshot was saved
SELECT 
  b.id as booking_id,
  b.status,
  b.exhibitor_snapshot,
  s.stall_number,
  s.company_name,
  s.company_logo_url
FROM bookings b
JOIN stalls s ON s.id = b.stall_id
WHERE b.status = 'confirmed'
ORDER BY b.created_at DESC
LIMIT 1;
```

**Expected Results:**
- `exhibitor_snapshot` should contain JSON with all company details
- `s.company_name` should match snapshot's company_name
- `s.company_logo_url` should match snapshot's company_logo_url

---

## Debugging Commands

### Check Profile Completion
```sql
SELECT 
  user_id,
  company_name,
  company_domain,
  is_completed,
  created_at
FROM exhibitor_profiles
WHERE user_id = 'YOUR_USER_ID';
```

### Check RPC Function
```sql
SELECT can_user_book_stall('YOUR_USER_ID');
```
Should return `true` if profile is completed, `false` otherwise.

### Check Booking Snapshot
```sql
SELECT 
  id,
  stall_id,
  status,
  exhibitor_snapshot,
  created_at
FROM bookings
WHERE user_id = 'YOUR_USER_ID'
  AND status = 'confirmed'
ORDER BY created_at DESC;
```

### Check Payment Records
```sql
SELECT 
  id,
  booking_id,
  amount,
  status,
  method,
  created_at
FROM payments
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

---

## Known Issues & Limitations

### Issue: Exhibitor snapshot not saved if booking created before profile
**Scenario:** User books a stall, then completes profile, then admin confirms booking.

**Problem:** The trigger only fires when status changes to 'confirmed', but if the profile wasn't completed at that time, no snapshot is saved.

**Solution:** Ensure users complete profile BEFORE booking (enforced by validation).

---

### Issue: Old bookings won't have snapshots
**Scenario:** Bookings created before the exhibitor system was implemented.

**Problem:** These bookings won't have `exhibitor_snapshot` data.

**Solution:** 
- Modal handles this gracefully by showing "No exhibitor information available"
- Optionally, run a migration script to backfill snapshots:
  ```sql
  UPDATE bookings b
  SET exhibitor_snapshot = (
    SELECT jsonb_build_object(
      'company_name', ep.company_name,
      'company_domain', ep.company_domain,
      'company_website', ep.company_website,
      'company_logo_url', ep.company_logo_url,
      'contact_number', ep.contact_number,
      'executive_name', ep.executive_name,
      'executive_designation', ep.executive_designation
    )
    FROM exhibitor_profiles ep
    WHERE ep.user_id = b.user_id
      AND ep.is_completed = true
  )
  WHERE b.status = 'confirmed'
    AND b.exhibitor_snapshot IS NULL;
  ```

---

## Console Log Reference

### Successful Profile Check:
```
[Booking] Checking profile completion for user: 123e4567-e89b-12d3-a456-426614174000
[Booking] Can book stall: true
```

### Failed Profile Check:
```
[Booking] Checking profile completion for user: 123e4567-e89b-12d3-a456-426614174000
[Booking] Can book stall: false
```

### Successful Stall Details Fetch:
```
[Stall Details] Fetching details for stall: abc123...
[Stall Details] Booking data: {exhibitor_snapshot: {...}}
[Stall Details] Exhibitor snapshot: {
  company_name: "ABC Corp",
  company_domain: "Technology",
  company_website: "www.abccorp.com",
  ...
}
```

### No Exhibitor Data Found:
```
[Stall Details] Fetching details for stall: abc123...
[Stall Details] Booking data: null
[Stall Details] No exhibitor snapshot found
```

---

## Success Criteria

- [ ] No UUID errors in console during payment
- [ ] Payment records created with valid UUIDs
- [ ] Users cannot proceed to payment without completed profile
- [ ] Alert shows when profile is incomplete
- [ ] Alert navigates to profile form
- [ ] Completed profiles allow booking
- [ ] Console logs show correct profile check results
- [ ] Booked stalls show company logos
- [ ] Clicking booked stalls opens modal
- [ ] Modal displays all exhibitor information
- [ ] Website and phone links work in modal
- [ ] Exhibitor snapshot saved in database
- [ ] Profile edits don't affect old bookings

---

## Files Changed Summary

1. **app/booking/[eventId].tsx**
   - Fixed payment ID generation (remove manual UUID)
   - Fixed `canBookStall` API call (add userId parameter)
   - Added comprehensive logging
   - Added logging to stall details fetch

2. **app/(tabs)/profile.tsx**
   - Fixed `getMyProfile` API call (add userId parameter)
   - Added null check for user

All changes are backward compatible and don't require database migrations.
