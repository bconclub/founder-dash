# Fix 502 Error - Deployment Issues

Based on the PM2 logs, there are **4 critical issues**:

## Issues Found

1. ❌ **Missing `unified_leads` view** - "Could not find the table 'public.unified_leads'"
2. ❌ **Build not found** - ".next directory missing"
3. ❌ **Port conflict** - App trying to use port 3000 instead of 3001
4. ❌ **Environment variables** - Not being read properly

## Fixes Applied

### 1. Updated Deployment Workflow
- Creates `.env.local` file on VPS with all environment variables
- Verifies `.next` directory exists after build
- Properly sets PORT=3001

### 2. Updated package.json
- Start script now respects PORT environment variable

## Action Required: Create unified_leads View

**You MUST run this SQL in Supabase** before the dashboard will work:

1. Go to https://supabase.com/dashboard
2. Open **SQL Editor** → **New query**
3. Copy and paste the SQL from `supabase/migrations/008_update_unified_leads_view.sql`
4. Click **Run**
5. Wait for success message

## After Running SQL

1. Push the updated workflow to trigger a new deployment:
   ```bash
   git add .github/workflows/deploy-dashboard.yml package.json
   git commit -m "Fix deployment: env vars, port, build verification"
   git push origin master
   ```

2. The deployment will:
   - Create `.env.local` on VPS
   - Build the app
   - Verify `.next` exists
   - Start on port 3001

3. Check logs:
   ```bash
   pm2 logs dashboard --lines 50
   ```

## Verify Everything Works

1. ✅ Check PM2 status: `pm2 status`
2. ✅ Check port: `netstat -tlnp | grep 3001`
3. ✅ Check logs: `pm2 logs dashboard`
4. ✅ Access dashboard in browser

## If Still Getting 502

1. **Check if unified_leads view exists:**
   ```sql
   SELECT * FROM information_schema.views 
   WHERE table_name = 'unified_leads';
   ```

2. **Check PM2 logs for specific errors:**
   ```bash
   pm2 logs dashboard --lines 200
   ```

3. **Restart PM2 manually:**
   ```bash
   pm2 restart dashboard
   ```

