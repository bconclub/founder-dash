# PROXe — New Brand Onboarding Guide

Step-by-step checklist for setting up a new client brand on PROXe, based on the BCON Club deployment.

---

## 1. Repository Setup

- [ ] Clone/pull latest from `production` branch
- [ ] Create brand folder: `brands/{brand}/agent/`
- [ ] Sync master code: copy `master/agent/src/` → `brands/{brand}/agent/src/`
- [ ] Copy config files: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- [ ] Copy `vercel.json` and update route timeouts if needed
- [ ] Create `brands/{brand}/agent/env.production.example` with all required env vars
- [ ] Add brand to `.gitignore` if needed (`.env.local` files)

---

## 2. Brand Config Files

### 2.1 Brand Config (`src/configs/brand.config.ts`)
- [ ] Create `{brand}Config` object with:
  - `name` — display name (e.g. "BCON Club")
  - `brand` — slug (e.g. "bcon")
  - Colors: `primary`, `secondary`, `darkBg`, `cardBg`, `border`, `text`, `mutedText`, `goldAccent`
  - `quickButtons` — 3 buttons shown on chat open
  - `exploreButtons` — category buttons
  - `chatStructure` — avatar, greeting, placeholder text
  - `systemPrompt.path` — path to prompt file

### 2.2 Config Index (`src/configs/index.ts`)
- [ ] Import brand config
- [ ] Set as default export (not proxeConfig or other brand)

### 2.3 System Prompt (`src/configs/prompts/{brand}-prompt.ts`)
- [ ] Create `get{Brand}SystemPrompt(context, messageCount)` function
- [ ] Define brand personality, tone, services, lead flow
- [ ] Include knowledge base injection: `${context}`
- [ ] Set message length rules
- [ ] Define first message restrictions
- [ ] Add objection handling scripts
- [ ] Add qualification flow

### 2.4 Prompt Builder (`src/lib/agent-core/promptBuilder.ts`)
- [ ] **CRITICAL**: Update import from old brand prompt to new brand prompt
- [ ] Change `getOldBrandSystemPrompt` → `get{Brand}SystemPrompt`
- [ ] Verify `buildSystemPrompt()` calls the correct function

---

## 3. Supabase Environment Variables

### 3.1 Static Key Access (Next.js Limitation)
**CRITICAL**: Next.js only inlines `NEXT_PUBLIC_*` vars with **static string keys** at build time. Dynamic access like `process.env[\`NEXT_PUBLIC_${brand}_*\`]` does NOT work on the client side.

Every file that reads Supabase env vars on the client must use static keys:
```typescript
// CORRECT — static key, gets inlined at build time
const url = process.env.NEXT_PUBLIC_BCON_SUPABASE_URL

// WRONG — dynamic key, stays undefined in browser
const brand = process.env.NEXT_PUBLIC_BRAND?.toUpperCase()
const url = process.env[`NEXT_PUBLIC_${brand}_SUPABASE_URL`]
```

### 3.2 Files That Need Static Env Var Access
- [ ] `src/lib/supabase/client.ts` — browser Supabase client
- [ ] `src/lib/supabase/server.ts` — server Supabase client
- [ ] `src/lib/supabase/middleware.ts` — auth middleware
- [ ] `src/app/api/auth/sync-session/route.ts` — session sync (POST + GET)

Search pattern to find all files: `grep -r "NEXT_PUBLIC_.*SUPABASE" src/`

### 3.3 Server-Side Files (dynamic access OK)
These run server-side only, so dynamic `process.env[key]` works:
- `src/lib/services/supabase.ts` — service role client
- API route handlers

### 3.4 Required Env Vars (Vercel)
```
NEXT_PUBLIC_BRAND=bcon
NEXT_PUBLIC_APP_URL=https://proxe.bconclub.com
NEXT_PUBLIC_BCON_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_BCON_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-4-5-20251001
META_WHATSAPP_ACCESS_TOKEN=...
META_WHATSAPP_PHONE_NUMBER_ID=...
META_WHATSAPP_VERIFY_TOKEN=...
```

**Important**: After adding/changing env vars in Vercel, you MUST trigger a new build (redeploy). `NEXT_PUBLIC_*` vars are baked in at build time, not runtime.

---

## 4. Branding — Full Search & Replace

Every new brand requires replacing ALL references to the previous brand. These are the categories:

### 4.1 Display Text
- [ ] `src/app/layout.tsx` — metadata title, description, icons
- [ ] `src/app/widget/layout.tsx` — `data-brand`, `data-theme`
- [ ] `src/app/auth/login/page.tsx` — logo, colors, brand name, footer links
- [ ] `src/app/auth/accept-invite/page.tsx` — logo, colors, brand name
- [ ] `src/components/dashboard/DashboardLayout.tsx` — sidebar brand name, icon paths
- [ ] `src/components/dashboard/FounderDashboard.tsx` — icon paths
- [ ] `src/components/PageTransitionLoader.tsx` — icon paths, alt text

### 4.2 Colors (globals.css)
- [ ] `src/app/globals.css` — **ROOT CAUSE of golden tint**: `:root` and `.dark` CSS variables
  - `--accent-primary`, `--accent-light`, `--accent-subtle`
  - `--bg-primary`, `--bg-secondary`, `--bg-hover`
  - `--border-primary`
  - `--text-primary`, `--text-secondary`
- [ ] `src/styles/theme.css` — brand-specific theme overrides
- [ ] `src/components/widget/ChatWidget.module.css` — `[data-brand="..."]` selectors, hardcoded colors
- [ ] `src/components/dashboard/ThemeProvider.tsx` — localStorage key, default color
- [ ] `src/app/dashboard/settings/page.tsx` — theme options, default selection

### 4.3 Data Keys (unified_context)
The `unified_context` JSON column in `all_leads` uses a brand key:
- [ ] `src/lib/services/contextBuilder.ts` — `unified_context.{brand}`
- [ ] `src/lib/services/leadManager.ts` — `unified_context.{brand}`
- [ ] `src/components/dashboard/LeadsTable.tsx` — `unified_context?.{brand}`
- [ ] `src/components/dashboard/LeadDetailsModal.tsx` — `unified_context?.{brand}`
- [ ] `src/components/dashboard/CalendarView.tsx` — `unified_context?.{brand}`
- [ ] `src/app/api/dashboard/leads/[id]/summary/route.ts` — `unified_context?.{brand}`
- [ ] `src/app/api/integrations/web-agent/route.ts` — `unified_context.{brand}`

### 4.4 Brand Key in Code
- [ ] `src/components/widget/ChatWidget.tsx` — `brand`, `brandKey`, config import
- [ ] `src/lib/chatLocalStorage.ts` — `StorageBrandKey` type
- [ ] `src/app/api/agent/whatsapp/webhook/route.ts` — default brand
- [ ] `src/app/api/agent/calendar/book/route.ts` — default brand
- [ ] `src/app/api/integrations/web-agent/route.ts` — default brand

### 4.5 Assets
- [ ] Add brand icon to `public/` (e.g. `bcon-icon.png`)
- [ ] Add brand logo to `public/` (e.g. `bcon-logo-white.webp`)
- [ ] Replace `favicon.ico`
- [ ] Remove old brand icons from `public/`

### 4.6 Grep Commands for Full Audit
```bash
# Find ALL old brand references (replace "windchasers" with previous brand)
grep -ri "windchasers" brands/{brand}/agent/src/ --include="*.ts" --include="*.tsx" --include="*.css" -l

# Find hardcoded old colors
grep -rn "#C9A961\|#D4AF37\|#1A0F0A" brands/{brand}/agent/src/ --include="*.ts" --include="*.tsx" --include="*.css"

# Find old env var references
grep -rn "WINDCHASERS" brands/{brand}/agent/src/ --include="*.ts" --include="*.tsx"
```

---

## 5. Authentication Setup

### 5.1 Supabase Auth
- [ ] Create Supabase project for the brand
- [ ] Enable email/password auth in Supabase Auth settings
- [ ] Create `dashboard_users` table (see schema below)
- [ ] Create `user_invitations` table

### 5.2 First Admin User
1. Supabase → Authentication → Users → Add User (email + password)
2. Supabase → Table Editor → `dashboard_users` → Insert row:
   - `id` = user UUID from step 1
   - `email` = same email
   - `role` = `admin`
   - `is_active` = `true`
3. Login at `https://{domain}/auth/login`

### 5.3 Google Auth
- [ ] Remove "Continue with Google" if not needed (login page, any OAuth handlers)
- [ ] Or configure Google OAuth in Supabase if needed

---

## 6. WhatsApp (Meta Cloud API) Setup

### 6.1 Code
- [ ] Verify `src/app/api/agent/whatsapp/meta/route.ts` exists
- [ ] Set fallback verify token in GET handler
- [ ] Ensure `vercel.json` has 30s timeout for the meta route

### 6.2 Meta Developer Console
1. Create Meta App → Add WhatsApp product
2. WhatsApp → API Setup → Get:
   - **Phone Number ID** → `META_WHATSAPP_PHONE_NUMBER_ID`
   - **Access Token** (temporary or permanent) → `META_WHATSAPP_ACCESS_TOKEN`
3. WhatsApp → Configuration → Webhook:
   - Callback URL: `https://{domain}/api/agent/whatsapp/meta`
   - Verify Token: match `META_WHATSAPP_VERIFY_TOKEN` in code/env
   - Subscribe to `messages` field
4. For permanent token: Business Settings → System Users → Generate token with `whatsapp_business_messaging` permission

### 6.3 Verify Token
The GET handler does:
```typescript
const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN || '{brand}-proxe-verify';
```
Set the same string in both Meta Console and your env var.

---

## 7. Vercel Deployment

### 7.1 Project Setup
- [ ] Create Vercel project linked to the repo
- [ ] Set **Root Directory** to `brands/{brand}/agent`
- [ ] Set **Framework Preset** to Next.js
- [ ] Configure custom domain
- [ ] Set deploy branch (usually `main`)

### 7.2 Env Vars
- [ ] Add all env vars from section 3.4
- [ ] Ensure all vars are scoped to **Production** (not just Preview)
- [ ] **Redeploy** after adding/changing any env var

### 7.3 Common Issues
- **404 on deploy**: Check root directory is set correctly
- **Placeholder Supabase URL in browser**: `NEXT_PUBLIC_*` vars need static access + rebuild
- **Session sync fails**: Check `sync-session/route.ts` uses correct brand env var names
- **Webhook verification fails**: Wait for build to complete, test with curl first

---

## 8. Supabase Schema

Required tables (run against brand's Supabase project):

### Core Tables
- `all_leads` — unified lead records across channels
- `conversations` — message logs (all channels)
- `web_sessions` — web chat sessions
- `whatsapp_sessions` — WhatsApp chat sessions
- `voice_sessions` — voice call sessions
- `social_sessions` — social media sessions
- `bookings` — calendar bookings
- `conversation_summaries` — AI-generated summaries

### Auth Tables
- `dashboard_users` — dashboard user profiles (id, email, full_name, role, is_active)
- `user_invitations` — invite tokens (email, token, role, invited_by, expires_at, accepted_at)

### Knowledge Base
- `knowledge_base` — uploaded documents and content
- `knowledge_base_chunks` — processed text chunks with embeddings

### Settings
- `widget_settings` — widget style preferences

---

## 9. Post-Deploy Checklist

- [ ] Login works at `https://{domain}/auth/login`
- [ ] Dashboard loads with correct brand colors
- [ ] No gold/old-brand colors visible
- [ ] Sidebar shows correct brand icon and name
- [ ] WhatsApp webhook verification passes (test with curl)
- [ ] Send test WhatsApp message → bot responds with correct brand personality
- [ ] Knowledge base page accessible in dashboard
- [ ] Settings page shows correct theme options
- [ ] Console has no `placeholder.supabase.co` errors
- [ ] No old brand name visible anywhere in UI

---

## Quick Reference — File Inventory

| Purpose | File |
|---------|------|
| Brand config | `src/configs/brand.config.ts` |
| Config index | `src/configs/index.ts` |
| System prompt | `src/configs/prompts/{brand}-prompt.ts` |
| Prompt builder | `src/lib/agent-core/promptBuilder.ts` |
| Supabase client | `src/lib/supabase/client.ts` |
| Supabase server | `src/lib/supabase/server.ts` |
| Supabase middleware | `src/lib/supabase/middleware.ts` |
| Session sync | `src/app/api/auth/sync-session/route.ts` |
| Service client | `src/lib/services/supabase.ts` |
| Meta webhook | `src/app/api/agent/whatsapp/meta/route.ts` |
| Global CSS | `src/app/globals.css` |
| Theme CSS | `src/styles/theme.css` |
| Root layout | `src/app/layout.tsx` |
| Login page | `src/app/auth/login/page.tsx` |
| Dashboard layout | `src/components/dashboard/DashboardLayout.tsx` |
| Theme provider | `src/components/dashboard/ThemeProvider.tsx` |
| Settings page | `src/app/dashboard/settings/page.tsx` |
| Chat widget | `src/components/widget/ChatWidget.tsx` |
| Widget CSS | `src/components/widget/ChatWidget.module.css` |
| Vercel config | `vercel.json` |
| Env template | `env.production.example` |
