# Admin Dashboard - Exhibition Booking System

## Project Overview
Next.js 14+ admin dashboard for managing exhibition events, stalls, bookings, and payments with Supabase backend.

## Tech Stack
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- Supabase (Database + Auth + Storage)
- Shadcn/ui components
- React Hook Form

## Setup Progress

- [x] Create copilot-instructions.md
- [x] Scaffold Next.js project
- [ ] Install dependencies
- [ ] Configure Supabase
- [ ] Setup shadcn/ui
- [ ] Create authentication
- [ ] Build events management
- [ ] Build stall generator
- [ ] Build bookings dashboard
- [ ] Test and verify

## Project Structure
```
adminExhibitionApp/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── events/
│   │   ├── stalls/
│   │   ├── bookings/
│   │   └── payments/
│   └── layout.tsx
├── components/
│   └── ui/
├── lib/
│   └── supabase.ts
└── .env.local
```

## Supabase Configuration
- URL: https://rihbalxthmgpxzsuogux.supabase.co
- Use service role key for admin operations
- Same database as mobile app

## Color Scheme
- Primary: Purple (#8B5CF6)
- Secondary: Orange (#F97316)
- Success: Green (#10B981)
