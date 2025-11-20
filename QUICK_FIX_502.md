# Quick Fix for 502 Error

## Most Likely Cause: Missing unified_leads View

The 502 error is almost certainly because the `unified_leads` view doesn't exist in your Supabase database.

## ✅ SOLUTION: Run This SQL

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor** → Click **New query**
3. **Copy the ENTIRE contents** of `supabase/migrations/008_update_unified_leads_view.sql`
4. **Paste and click Run**
5. **Wait for success message**

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT * FROM unified_leads LIMIT 1;
```

If it returns (even if empty), the view exists! ✅

## After Running SQL

1. **Restart the app on VPS** (or wait for next deployment):
   ```bash
   pm2 restart dashboard
   ```

2. **Check logs**:
   ```bash
   pm2 logs dashboard --lines 50
   ```

3. **Refresh your dashboard** - should work now!

## If Still 502 After Running SQL

Check PM2 logs for the exact error:

```bash
pm2 logs dashboard --lines 100
```

Common issues:
- ❌ "Could not find the table 'public.unified_leads'" → **View not created** (run SQL again)
- ❌ "Could not find a production build" → **Build failed** (run `npm run build` on VPS)
- ❌ "EADDRINUSE" → **Port conflict** (kill process on port 3000)

## Need Help?

Share the output of:
```bash
pm2 logs dashboard --lines 100
```

This will show the exact error message.

