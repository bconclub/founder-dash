# Windchasers Web-Agent Deployment Checklist

## ✅ Completed Steps

1. ✅ Migration file committed (`023_enhance_knowledge_base.sql`)
2. ✅ Code pushed to production branch
3. ✅ GitHub Actions deployment triggered

## 🔄 Next Steps

### 1. Run Database Migration

The migration needs to be run on your Supabase database. You can do this in two ways:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Windchasers project
3. Navigate to **SQL Editor**
4. Copy the contents of `brand/windchasers/web-agent/supabase/migrations/023_enhance_knowledge_base.sql`
5. Paste and run the SQL script
6. Verify the migration succeeded (check for any errors)

#### Option B: Via Supabase CLI (if configured)
```bash
cd brand/windchasers/web-agent
supabase db push
```

### 2. Verify Deployment

Check GitHub Actions workflow status:
- Go to: https://github.com/bconclub/proxe-dashboard/actions
- Look for "Deploy Windchasers Web-Agent" workflow
- Ensure it completes successfully

### 3. Verify Web-Agent is Running on VPS

SSH into your VPS and check:
```bash
# Check PM2 status
pm2 list | grep windchasers-web-agent

# Check logs
pm2 logs windchasers-web-agent --lines 50

# Test widget endpoint
curl http://localhost:3001/widget
```

### 4. Test Widget Endpoint

Once deployed, test the widget URL:
- Widget URL: `https://pilot.windchasers.in/widget`
- Should load the chat widget interface
- Check browser console for any errors

### 5. Embed Widget on Live Website

See `WIDGET_EMBEDDING.md` for detailed instructions. Quick version:

```html
<iframe 
  src="https://pilot.windchasers.in/widget"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; z-index: 9999;"
  allow="microphone; camera"
></iframe>
```

**Widget Domain**: `https://pilot.windchasers.in/widget`

### 6. Test Lead Capture

1. Open your live website with the embedded widget
2. Start a chat conversation
3. Complete the flow (provide name, email, phone)
4. Check the Windchasers dashboard inbox to verify the lead was captured
5. Verify all lead data (name, email, phone, conversation) is present

## 🔍 Troubleshooting

### Deployment Issues
- Check GitHub Actions logs for build errors
- Verify `.env.local` exists on VPS with correct Supabase credentials
- Check PM2 logs: `pm2 logs windchasers-web-agent`

### Migration Issues
- Verify you're running the migration on the correct Supabase project
- Check Supabase logs for any SQL errors
- Ensure you have proper database permissions

### Widget Not Loading
- Verify web-agent is accessible at the widget URL
- Check CORS settings in middleware.ts
- Check browser console for errors
- Verify iframe is not blocked by browser extensions

### Leads Not Capturing
- Check Supabase connection in web-agent logs
- Verify `chat_sessions` and `leads` tables exist
- Check dashboard inbox for new leads
- Review API route logs: `/api/chat/route.ts`

## 📝 Notes

- The migration adds `question`, `answer`, and `subcategory` columns to `knowledge_base` table
- It also creates enhanced full-text search functionality
- The web-agent runs on port 3001 by default
- Widget is accessible at `/widget` endpoint
