# Troubleshoot 502 Bad Gateway

## Quick Diagnostic Steps

### 1. Check if unified_leads view exists

Run this in Supabase SQL Editor:

```sql
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'unified_leads';
```

**If it returns nothing**, run migration `008_update_unified_leads_view.sql`

### 2. Check PM2 Status on VPS

SSH into your VPS and run:

```bash
pm2 status
pm2 logs dashboard --lines 50
```

Look for:
- ❌ "Could not find the table 'public.unified_leads'"
- ❌ "Could not find a production build"
- ❌ "EADDRINUSE" (port conflict)
- ❌ "Supabase environment variables are not set"

### 3. Verify Build Exists

```bash
cd /var/www/dashboard
ls -la .next
```

Should see `.next` directory with `BUILD_ID` file.

### 4. Check Environment Variables

```bash
cd /var/www/dashboard
cat .env.local
```

Should have:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PORT=3001`

### 5. Check Port

```bash
netstat -tlnp | grep 3001
# or
ss -tlnp | grep 3001
```

Should show Node.js process listening on port 3001.

## Common Fixes

### Fix 1: Create unified_leads View

If view doesn't exist, run in Supabase SQL Editor:

```sql
-- Copy entire contents of supabase/migrations/008_update_unified_leads_view.sql
-- Paste and run in Supabase SQL Editor
```

### Fix 2: Rebuild Application

On VPS:

```bash
cd /var/www/dashboard
rm -rf .next node_modules
npm install
npm run build
pm2 restart dashboard
```

### Fix 3: Fix Port Conflict

```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart PM2
pm2 restart dashboard
```

### Fix 4: Check Nginx/Reverse Proxy

If using Nginx, check config:

```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Step-by-Step Recovery

1. **SSH into VPS**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Check current status**
   ```bash
   cd /var/www/dashboard
   pm2 status
   pm2 logs dashboard --lines 100
   ```

3. **If unified_leads missing:**
   - Go to Supabase dashboard
   - Run migration `008_update_unified_leads_view.sql`

4. **If build missing:**
   ```bash
   cd /var/www/dashboard
   npm run build
   pm2 restart dashboard
   ```

5. **If env vars missing:**
   ```bash
   cd /var/www/dashboard
   # Edit .env.local or create it
   nano .env.local
   # Add:
   # NEXT_PUBLIC_SUPABASE_URL=...
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   # PORT=3001
   pm2 restart dashboard
   ```

6. **Verify it's working:**
   ```bash
   pm2 logs dashboard --lines 20
   curl http://localhost:3001
   ```

## Still Not Working?

Share the output of:
```bash
pm2 logs dashboard --lines 100
```

This will show the exact error.

