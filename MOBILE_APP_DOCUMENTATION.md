# Exhibition Booking Mobile App - Complete Documentation

## 📱 Application Overview

A cross-platform React Native mobile application for booking exhibition stalls/booths in real-time. Built for the Indian market with Razorpay integration, the app enables users to browse upcoming exhibitions, select available stalls through an interactive seat map, and complete bookings with secure payments.

---

## 🎯 Core Ideology & Design Philosophy

### User-First Approach
- **Instant Visual Feedback**: Real-time stall availability using Skia Canvas for smooth 60fps rendering
- **Offline-First Storage**: Critical data cached locally using MMKV for instant access even without internet
- **Indian Payment Ecosystem**: Native UPI, NetBanking, and card support via Razorpay
- **Minimal Friction**: Single-tap booking flow with 15-minute reservation holds

### Technical Philosophy
- **Performance Over Features**: GPU-accelerated rendering for 1000+ stalls without lag
- **Security by Default**: Encrypted local storage, secure session management, RLS policies
- **Scalability Ready**: Optimistic locking prevents double-booking, supports high concurrency
- **Maintainable Codebase**: Type-safe APIs, centralized state, clear separation of concerns

### Color Psychology
- **Purple (#8B5CF6)**: Trust, innovation, premium feel
- **Orange (#F97316)**: Energy, urgency, action-oriented (booking CTAs)
- **Green (#10B981)**: Success, availability, confirmation states

---

## 🏗️ Architecture & Tech Stack

### Frontend Framework
```
React Native 0.76.5
├── Expo SDK 54.0.25 (managed workflow)
├── Expo Router 6.0.15 (file-based routing)
└── TypeScript (strict mode enabled)
```

### Backend & Database
```
Supabase
├── PostgreSQL (relational data)
├── Realtime Subscriptions (WebSocket)
├── Row Level Security (multi-tenant isolation)
├── Storage Buckets (event images)
└── Auth (email/password, phone OTP ready)
```

### Key Libraries
| Library | Purpose | Why Chosen |
|---------|---------|------------|
| **@shopify/react-native-skia** | Canvas rendering | GPU-accelerated seat maps, 60fps performance |
| **react-native-mmkv** | Local storage | 30x faster than AsyncStorage, encryption support |
| **@supabase/supabase-js** | Backend client | Real-time updates, type-safe queries |
| **react-native-razorpay** | Payments | India-focused, UPI/NetBanking support |
| **expo-linear-gradient** | UI polish | Gradient headers matching brand colors |

### Storage Strategy
```
MMKV Storage Instances:
├── exhibition-app (general cache, 15min TTL)
├── user-data (profile, preferences, persistent)
└── booking-cache (offline tickets, stall selections)

Cached Data:
- Event listings (15-minute expiry)
- User session tokens (encrypted)
- Offline booking tickets (QR codes)
- Last sync timestamps
```

---

## 📂 Project Structure

```
exhibitionApp/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication flow
│   │   ├── _layout.tsx           # Auth wrapper with redirect logic
│   │   ├── login.tsx             # Email/password login
│   │   └── register.tsx          # User registration with validation
│   │
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx           # Tab navigation (4 tabs)
│   │   ├── index.tsx             # Events listing (published events)
│   │   ├── bookings.tsx          # User's active bookings
│   │   ├── history.tsx           # Payment transaction history
│   │   └── profile.tsx           # User profile management
│   │
│   ├── event/
│   │   └── [id].tsx              # Event detail screen (dynamic route)
│   │
│   ├── booking/
│   │   └── [eventId].tsx         # Stall selection with Skia seat map
│   │
│   └── _layout.tsx               # Root layout with AuthProvider
│
├── components/
│   ├── SkiaSeatMap.tsx           # High-performance canvas seat selector
│   ├── themed-text.tsx           # Typography component
│   └── themed-view.tsx           # Container component
│
├── constants/
│   └── theme.ts                  # BrandColors, SeatColors definitions
│
├── hooks/
│   ├── useAuth.tsx               # Authentication context & hooks
│   └── use-color-scheme.ts       # Dark/light mode detection
│
├── lib/
│   ├── supabase.ts               # Supabase client configuration
│   ├── storage.ts                # MMKV storage utilities
│   └── api.ts                    # Centralized API layer
│
└── types/
    └── index.ts                  # TypeScript interfaces (Event, Booking, etc.)
```

---

## 🛣️ Navigation & Routing

### Route Structure (Expo Router File-Based)

```
Authentication Flow:
/ (root)
├── /login                        # Public route
├── /register                     # Public route
└── (auth redirect logic)

Main App (Tabs):
/(tabs)
├── / (index)                     # Events tab
├── /bookings                     # Bookings tab
├── /history                      # History tab
└── /profile                      # Profile tab

Nested Screens:
/event/[id]                       # Event detail (dynamic parameter)
/booking/[eventId]                # Stall selection + payment
```

### Navigation Guards
```typescript
// In (auth)/_layout.tsx
useEffect(() => {
  if (user && !loading) {
    router.replace('/(tabs)');  // Redirect authenticated users
  }
}, [user, loading]);

// In booking/[eventId].tsx
useEffect(() => {
  if (!user && !loading) {
    router.replace('/login');     // Protect authenticated routes
  }
}, [user, loading]);
```

---

## 🎨 UI/UX Features

### Screen Breakdown

#### 1. **Events Listing Screen** (`app/(tabs)/index.tsx`)
**Purpose**: Browse all published exhibitions

**Features**:
- Pull-to-refresh for latest events
- Gradient header (purple → dark purple)
- Event cards showing:
  - Title, description, location
  - Date range (formatted for Indian locale)
  - Available stalls count (green badge)
  - Price per stall (₹ currency format)
- Tap card → Navigate to event details

**Data Flow**:
```
User opens app → useEffect() → EventsAPI.getEvents() 
→ Supabase query (published events only)
→ Cache in MMKV (15min TTL)
→ Display cards
```

#### 2. **Event Detail Screen** (`app/event/[id].tsx`)
**Purpose**: View complete event information

**Features**:
- Hero image (Supabase Storage or fallback)
- Full description, venue details
- Date/time prominently displayed
- Statistics cards:
  - Total stalls
  - Available stalls (real-time)
  - Price per stall
- "Book Now" CTA button (orange gradient)

**Navigation**:
```
Events List → Tap card → event/[id]
              ↓
         Book Now button
              ↓
         booking/[eventId]
```

#### 3. **Stall Selection Screen** (`app/booking/[eventId].tsx`)
**Purpose**: Interactive seat/stall selection

**Features**:
- **SkiaSeatMap Component**:
  - GPU-rendered canvas (60fps)
  - Color-coded stalls:
    - Green: Available
    - Orange: Reserved (15min hold)
    - Gray: Booked
  - Touch handlers for selection
  - STAGE indicator at top
  - Stall numbers on each seat
- Real-time updates via Supabase Realtime
- Selected stall highlights (purple border)
- Price summary at bottom
- "Proceed to Payment" button

**Booking Flow**:
```
1. User taps available stall (green)
2. Stall turns purple (selected)
3. Price updates at bottom
4. Tap "Proceed to Payment"
5. Call create_booking_with_lock() RPC
   - Locks stall row in database
   - Creates booking (status: pending)
   - Sets 15min expiration
6. If successful → Razorpay payment screen
7. If failed → Show "Already booked" toast
```

#### 4. **Bookings Screen** (`app/(tabs)/bookings.tsx`)
**Purpose**: View user's active bookings

**Features**:
- List of confirmed bookings
- Each card shows:
  - Event name
  - Stall number
  - Booking status badge
  - Payment status (paid/pending)
  - Amount paid
  - QR code for ticket (if confirmed)
- Tap card → View booking details
- Pull-to-refresh

**Status Colors**:
- Pending: Yellow
- Confirmed: Green
- Cancelled: Red
- Completed: Purple

#### 5. **Payment History** (`app/(tabs)/history.tsx`)
**Purpose**: Transaction history for user

**Features**:
- Chronological payment list
- Filters: All, Captured, Failed, Refunded
- Each transaction shows:
  - Razorpay payment ID
  - Amount (₹ format)
  - Payment method (UPI/Card/NetBanking)
  - Date/time
  - Status badge
- Tap transaction → View receipt details

#### 6. **Profile Screen** (`app/(tabs)/profile.tsx`)
**Purpose**: User account management

**Features**:
- Display:
  - Name (editable)
  - Email (read-only)
  - Phone number (editable)
  - Avatar upload (future)
- Statistics cards:
  - Total bookings
  - Total spent
- Logout button

---

## 🔐 Authentication & Security

### Authentication Flow
```
Supabase Auth (Email/Password):

Registration:
1. User fills form (email, password, name, phone)
2. supabase.auth.signUp()
3. Create profile record in profiles table
4. Save session to MMKV (encrypted)
5. Redirect to /(tabs)

Login:
1. User enters credentials
2. supabase.auth.signInWithPassword()
3. Retrieve session
4. Save to MMKV
5. Update AuthContext state
6. Redirect to /(tabs)

Auto-Login:
1. App launches
2. Check MMKV for saved session
3. Validate with Supabase
4. If valid → Auto-login
5. If expired → Clear session, show login
```

### Security Measures
- **MMKV Encryption**: All storage instances use encryption keys
- **Session Tokens**: Automatically refreshed by Supabase client
- **RLS Policies**: Users can only access their own data
- **Atomic Bookings**: Row-level locks prevent race conditions
- **HTTPS Only**: All API calls encrypted in transit

---

## 📡 API Layer & Data Management

### Centralized API (`lib/api.ts`)

```typescript
Structure:

EventsAPI {
  getEvents(): Promise<Event[]>
  getEventById(id): Promise<Event>
  getStallsForEvent(eventId): Promise<Stall[]>
}

BookingsAPI {
  getUserBookings(userId): Promise<Booking[]>
  createBooking(data): Promise<Booking>
  cancelBooking(bookingId): Promise<void>
}

PaymentsAPI {
  getPaymentHistory(userId): Promise<Payment[]>
  createPayment(data): Promise<Payment>
  updatePaymentStatus(id, status): Promise<void>
}

RealtimeAPI {
  subscribeToStallUpdates(eventId, callback)
  subscribeToBookingUpdates(userId, callback)
}
```

### Caching Strategy
```typescript
StorageUtils.getCachedData():
1. Check MMKV for key
2. If found:
   - Parse JSON
   - Check expiry timestamp
   - If valid → Return cached data
   - If expired → Fetch fresh data
3. If not found → Fetch fresh data
4. Save to MMKV with expiry

Cache Keys:
- events_list (15min TTL)
- event_detail_{id} (15min TTL)
- user_bookings_{userId} (5min TTL)
- payment_history_{userId} (10min TTL)
```

### Real-Time Updates
```typescript
Supabase Realtime Channels:

1. Stall Availability:
supabase
  .channel(`event_${eventId}_stalls`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stalls',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Update stall status in UI instantly
    updateStallState(payload.new)
  })

2. Booking Updates:
supabase
  .channel(`user_${userId}_bookings`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Refresh bookings list
    fetchUserBookings()
  })
```

---

## 🎨 Component Architecture

### SkiaSeatMap Component (`components/SkiaSeatMap.tsx`)

**Purpose**: High-performance canvas-based stall selector

**Props**:
```typescript
interface SkiaSeatMapProps {
  stalls: Stall[]              // Array of stall objects
  onStallSelect: (stall) => void
  selectedStallId?: string
}
```

**Rendering Logic**:
```typescript
1. Calculate canvas size (device width - padding)
2. Determine stall dimensions (based on grid layout)
3. For each stall:
   - Calculate x,y position from position_x, position_y
   - Determine color from status:
     - available → green
     - reserved → orange
     - booked → gray
     - selected → purple border
   - Draw rectangle (Skia.Rect)
   - Draw stall number text (Skia.Text)
4. Add STAGE indicator at top
5. Handle touch events:
   - Convert touch coordinates to stall position
   - Find matching stall
   - Call onStallSelect() callback
```

**Performance Optimization**:
- Uses GPU rendering (Skia Canvas)
- Minimal re-renders (memoized calculations)
- 60fps smooth scrolling/zooming
- Handles 1000+ stalls without lag

---

## 💳 Payment Integration (Razorpay)

### Payment Flow
```
1. User selects stall
2. Creates booking (status: pending)
3. Initialize Razorpay:
   - Create order on backend (future)
   - Get razorpay_order_id
4. Open Razorpay native checkout:
   RazorpayCheckout.open({
     key: RAZORPAY_KEY_ID,
     amount: booking.amount * 100,  // Paise
     currency: 'INR',
     order_id: razorpay_order_id,
     name: event.title,
     prefill: {
       email: user.email,
       contact: user.phone
     }
   })
5. Handle payment result:
   - onSuccess: 
     - Update booking (status: confirmed)
     - Create payment record
     - Show success toast
   - onFailure:
     - Keep booking as pending
     - Show retry option
```

### Webhook Handling (Future Backend)
```
Razorpay sends webhook to backend:
POST /api/webhooks/razorpay
{
  event: "payment.captured",
  payload: {
    payment_id: "pay_xxx",
    order_id: "order_xxx",
    amount: 25000
  }
}

Backend verifies signature → Updates payment status
```

---

## 🔄 State Management

### Context Providers

```typescript
AuthContext (hooks/useAuth.tsx):
├── State: user, session, loading
├── Methods: signIn, signUp, signOut
└── Usage: Wrap entire app, access via useAuth()

Example:
const { user, signOut } = useAuth()
if (!user) return <LoginScreen />
```

### Local State Patterns
```typescript
Common Pattern in Screens:

const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [refreshing, setRefreshing] = useState(false)

useEffect(() => {
  fetchData()
}, [])

const onRefresh = async () => {
  setRefreshing(true)
  await fetchData()
  setRefreshing(false)
}
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist
```
Authentication:
☐ Register new user
☐ Login with valid credentials
☐ Login with invalid credentials
☐ Auto-login on app restart
☐ Logout functionality

Event Browsing:
☐ View all published events
☐ Pull-to-refresh events list
☐ Tap event card → Navigate to detail
☐ View event details correctly

Stall Booking:
☐ Select available stall (turns purple)
☐ Deselect stall
☐ Try selecting booked stall (should fail)
☐ Real-time updates when other user books
☐ Price calculation correct

Payment:
☐ Initiate payment flow
☐ Complete payment (test mode)
☐ Handle payment failure
☐ Verify booking confirmation

Data Persistence:
☐ Close app → Reopen → Data still cached
☐ Offline mode → View cached events
☐ Network reconnect → Sync latest data
```

---

## 🚀 Deployment & Build

### Environment Configuration
```env
# .env file
EXPO_PUBLIC_SUPABASE_URL=https://rihbalxthmgpxzsuogux.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

### Build Commands
```bash
# Development
npm start           # Start Expo dev server
npm run web         # Run on web browser
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator

# Production Build
eas build --platform android  # Android APK/AAB
eas build --platform ios      # iOS IPA
eas submit                    # Submit to stores
```

### Performance Optimization
- **Code Splitting**: Lazy load heavy screens
- **Image Optimization**: Use Expo Image for caching
- **Bundle Size**: Tree-shaking, remove unused deps
- **Startup Time**: Minimize app/_layout.tsx imports

---

## 📊 Database Schema Integration

### Key Tables Used

```sql
profiles:
- id (UUID, FK to auth.users)
- name, phone, avatar_url
- Used by: Profile screen, AuthContext

events:
- id, title, description, location
- start_date, end_date, status
- total_stalls, available_stalls, price_per_stall
- Used by: Events list, Event detail

stalls:
- id, event_id, stall_number
- position_x, position_y (for Skia rendering)
- status (available/reserved/booked/disabled)
- price, features[]
- Used by: SkiaSeatMap, Booking screen

bookings:
- id, event_id, stall_id, user_id
- status, payment_status, amount
- expires_at (15min reservation)
- Used by: Bookings screen, Booking flow

payments:
- id, booking_id, razorpay_payment_id
- amount, status, method
- Used by: History screen, Payment flow
```

### RLS Policies (Row Level Security)
```sql
Users can only:
- View published events (public)
- Create bookings for themselves
- View their own bookings/payments
- Update their own profile

Prevents:
- Accessing other users' data
- Modifying event data (admin only)
- Double-booking via concurrent requests
```

---

## 🛠️ Developer Workflow

### Getting Started
```bash
1. Clone repository
2. Install dependencies: npm install
3. Configure .env file with Supabase credentials
4. Run database migrations (01_schema.sql, 02_seed_data.sql)
5. Start dev server: npm start
6. Scan QR code with Expo Go app
```

### Code Style Guidelines
```typescript
// Use named exports
export function EventCard() {}

// Destructure props
export function EventCard({ event, onPress }: Props) {}

// TypeScript strict mode
interface Event {
  id: string
  title: string
  // ... all fields typed
}

// Async/await error handling
try {
  const data = await api.getEvents()
} catch (error) {
  toast.error('Failed to load events')
}
```

### Folder Conventions
```
Components: PascalCase (EventCard.tsx)
Hooks: camelCase with 'use' prefix (useAuth.tsx)
Utils: camelCase (storage.ts, api.ts)
Constants: UPPER_SNAKE_CASE (BrandColors)
Types: PascalCase interfaces (Event, Booking)
```

---

## 🔮 Future Enhancements

### Planned Features
1. **QR Code Tickets**: Generate scannable tickets for confirmed bookings
2. **Push Notifications**: Booking confirmations, payment reminders
3. **Social Sharing**: Share events on WhatsApp, Instagram
4. **Advanced Filters**: Filter events by date, location, price range
5. **Favorites**: Save events to wishlist
6. **Multi-Language**: Hindi, Gujarati, Marathi support
7. **Dark Mode**: System-based theme switching
8. **Analytics**: User behavior tracking (Firebase Analytics)
9. **Offline Booking**: Queue bookings when offline, sync when online
10. **Referral System**: Earn credits by referring friends

### Technical Debt
- [ ] Add unit tests (Jest + React Native Testing Library)
- [ ] Add E2E tests (Detox)
- [ ] Implement error boundary components
- [ ] Add Sentry for crash reporting
- [ ] Optimize image loading with placeholder shimmer
- [ ] Add skeleton loaders for better perceived performance

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Cannot connect to Supabase"
**Solution**: Check .env file has correct SUPABASE_URL and ANON_KEY

**Issue**: "Stalls not rendering in SkiaSeatMap"
**Solution**: Verify position_x, position_y are valid integers in database

**Issue**: "Payment screen not opening"
**Solution**: Ensure Razorpay key is configured, check React Native logs

**Issue**: "App crashes on startup"
**Solution**: Clear cache: `npx expo start -c`

### Debug Mode
```typescript
// Enable debug logs
if (__DEV__) {
  console.log('API Response:', data)
  console.log('Cache Hit:', cacheKey)
}
```

---

## 📄 License & Credits

**Built with**:
- React Native & Expo (Meta/Expo)
- Supabase (Open source backend)
- Shopify React Native Skia
- MMKV by React Native Community

**Design Inspiration**: Modern fintech apps (PhonePe, Paytm color schemes)

---

## 🎓 Learning Resources

For developers new to the stack:

- **Expo Router**: https://docs.expo.dev/router/introduction/
- **Supabase**: https://supabase.com/docs
- **React Native Skia**: https://shopify.github.io/react-native-skia/
- **MMKV**: https://github.com/mrousavy/react-native-mmkv
- **Razorpay React Native**: https://razorpay.com/docs/

---

## 📈 Performance Metrics

**Target Benchmarks**:
- App startup: < 2 seconds
- Screen navigation: < 100ms
- API response: < 500ms (cached)
- Seat map rendering: 60fps (1000 stalls)
- Payment flow: < 30 seconds end-to-end

**Monitoring**:
- Expo Dev Tools for bundle size
- React DevTools Profiler for renders
- Flipper for network requests
- Supabase Dashboard for query performance

---

*Last Updated: November 28, 2025*
*Version: 1.0.0*
*Maintained by: Exhibition Booking Team*
