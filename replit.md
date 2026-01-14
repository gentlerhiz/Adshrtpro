# AdShrtPro - URL Shortener Platform

## Overview
AdShrtPro is a professional URL shortening and analytics platform with blog system and admin panel.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, wouter, TanStack Query
- **Backend**: Express.js, session-based auth
- **Storage**: In-memory storage (MemStorage)
- **Styling**: TailwindCSS with Inter and Plus Jakarta Sans fonts

## Project Structure
```
client/
  src/
    components/       # Reusable UI components
      navigation.tsx  # Main navigation bar
      footer.tsx      # Site footer
      url-shortener.tsx  # URL shortening form
    lib/
      auth-context.tsx   # Authentication state
      theme-context.tsx  # Dark/light theme
      queryClient.ts     # React Query setup
    pages/
      home.tsx           # Landing page with URL shortener
      login.tsx          # Login page
      register.tsx       # Registration page
      verify-email.tsx   # Email verification
      dashboard.tsx      # User link management
      analytics.tsx      # Link analytics (with unlock)
      qr-codes.tsx       # QR code generator
      blog.tsx           # Blog listing
      blog-post.tsx      # Individual blog post
      privacy.tsx        # Privacy policy
      terms.tsx          # Terms of service
      contact.tsx        # Contact form
      admin/
        index.tsx        # Admin dashboard
        blog-editor.tsx  # Blog post editor
server/
  routes.ts         # API endpoints
  storage.ts        # In-memory data storage
shared/
  schema.ts         # TypeScript types and schemas
```

## Features
- URL shortening with custom aliases
- Bulk link shortening (up to 50 URLs at once)
- Click analytics (requires unlock via rewarded ad simulation)
- QR code generation with color customization
- Blog system for SEO
- Admin panel for platform management
- Rate limiting (250 links/IP/month)
- Dark/light theme support

## Running the App
The app runs on port 5000 using `npm run dev`.

## Environment Variables
- `SESSION_SECRET` - Session encryption key
- `ADMIN_EMAIL` - Email for super admin account

## API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/links` - Create shortened link
- `POST /api/links/bulk` - Bulk create links (max 50 URLs, requires auth)
- `GET /api/links` - Get user's links
- `DELETE /api/links/:id` - Delete link
- `GET /api/analytics/:linkId` - Get link analytics
- `POST /api/analytics/unlock` - Unlock analytics
- `GET /api/blog` - Get all blog posts
- `GET /api/blog/:slug` - Get single post
- `GET /api/admin/stats` - Platform statistics
- Admin routes for managing users, links, blog, settings

## Recent Changes
- Initial MVP implementation with all core features
- Added sample blog posts for demonstration
- Fixed authentication flow:
  - Server explicitly saves session before responding (prevents race condition)
  - Protected pages wait for auth loading before redirecting
  - Redirects moved to useEffect to prevent render-time navigation issues
  - Auth context uses targeted cache updates instead of clearing all cache
- Implemented per-link analytics unlock system:
  - Server-side storage in MemStorage.linkUnlocks Map (keyed by userId:linkId)
  - GET /api/analytics/:linkId/unlock-status endpoint for checking status
  - Server validates unlock before returning analytics data (admins bypass)
  - Client uses React Query with 30-second polling for sync
  - Precise setTimeout locks UI exactly at server expiry time
  - Real-time expiry validation on every render prevents stale cache issues
- Fixed QR codes page to use the same per-link unlock system
- Fixed 1-hour countdown timer with proper hours:minutes:seconds format
- Added sponsor post detail page at /sponsor/:id with full sponsor information
- Added "Details" button to sponsored posts carousel linking to detail page
- Fixed rewarded ad code integration:
  - Added `rewardedAdCode` and `adsenseCode` to default settings in storage
  - Created public `/api/settings/ads` endpoint for fetching ad settings
  - Analytics and QR pages now display ad code in dialog before unlocking
  - Ad code is injected dynamically using createContextualFragment
- Added Custom Ads Manager feature:
  - Admin can create custom ads with name, ad code (HTML/script), placement, device type, and size
  - Predefined ad sizes: Leaderboard (728x90), Large Leaderboard (970x90), Medium Rectangle (300x250), Large Rectangle (336x280), Mobile Banner (320x50), Large Mobile Banner (320x100)
  - Placements: header, footer, sidebar, in-content
  - Device targeting: desktop, mobile, or both
  - Enable/disable individual ads
  - Public API `/api/custom-ads?placement=header` returns enabled ads filtered by placement
  - AdDisplay component for rendering custom ads on public pages with fallback logic
- Implemented bulk link shortening feature:
  - POST /api/links/bulk endpoint accepts array of URLs (max 50)
  - Respects rate limiting (checks remaining quota before processing)
  - Returns success/failure status for each URL
  - Dashboard UI with "Bulk Import" button and dialog
  - Shows real-time results with success/failure indicators
  - Copy button for each successfully created short link
- Added content policy warning to all URL shortening interfaces
- Comprehensive UX audit and fixes:
  - Auth context now uses 401-tolerant queryFn for reliable auth state resolution
  - Protected page queries gated with `enabled: !!user` to prevent premature fetching
  - Replaced window.location redirects with wouter navigation for SPA behavior
  - Fixed analytics/QR unlock flows with proper query invalidation after mutations
  - Added loading states to logout button to prevent double-triggering
  - Added `isLoggingOut` state to auth context for UI feedback
- Social Verification System for Referrals:
  - Users must complete Social Verification (follow official social media + submit screenshot proof) to unlock referral rewards
  - Both referrer and referee must be socially verified + referee creates 3+ links before both receive $0.10 reward
  - SocialVerification schema with userId, screenshotLinks, status (pending/approved/rejected), and timestamps
  - Tasks page features prominent Social Verification task with submission dialog
  - Admin Earning page has "Social" tab for reviewing verification submissions with approve/reject actions
  - Referrals page updated with clear requirements showing verification status and step-by-step guide
  - AuthUser interface extended with socialVerified field returned in all auth responses
