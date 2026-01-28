# Web-Agent Preview Architecture Analysis

## Executive Summary

The web-agent preview in the dashboard uses **iframe embedding** to display a separate Next.js application. The web-agent runs as an **independent Next.js app** on a different port. When you start the dashboard, it appears to also start the web-agent because of a `concurrently` script in the `package.json` that runs both processes simultaneously for development convenience.

---

## 1. How the Preview Works: Iframe Embedding

### Architecture Pattern: **Direct Iframe Embedding**

The dashboard embeds the web-agent preview using a standard HTML `<iframe>` element. This is **not** a proxy or API integration—it's a direct cross-origin iframe embedding.

### Implementation Details

**Location**: `brand/windchasers/dashboard/build/src/app/dashboard/settings/web-agent/WebAgentSettingsClient.tsx`

```tsx
<iframe
  ref={iframeRef}
  src={process.env.NEXT_PUBLIC_WEB_AGENT_URL 
    ? `${process.env.NEXT_PUBLIC_WEB_AGENT_URL}/widget`
    : typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4003/widget'  // Local development
    : 'https://widget.proxe.windchasers.in/widget'}  // Production
  className="w-full h-full border-0"
  title="Widget Preview"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
  allow="microphone; camera"
/>
```

### URL Resolution Logic

The iframe `src` is determined by:

1. **Environment Variable** (highest priority):
   - If `NEXT_PUBLIC_WEB_AGENT_URL` is set → Uses that URL + `/widget`
   - Example: `https://widget.proxe.windchasers.in/widget`

2. **Localhost Detection** (development):
   - If running on `localhost` → Uses `http://localhost:4003/widget`
   - Port 4003 is the Windchasers web-agent dev port

3. **Production Fallback**:
   - Defaults to `https://widget.proxe.windchasers.in/widget`

### Iframe Sandbox Permissions

The iframe uses these sandbox permissions:
- `allow-scripts` - Enables JavaScript execution
- `allow-same-origin` - Allows same-origin requests (needed for API calls)
- `allow-forms` - Enables form submission
- `allow-popups` - Allows popup windows
- `allow-modals` - Allows modal dialogs

---

## 2. Web-Agent as Separate Next.js Application

### Confirmation: Web-Agent is Independent

**Evidence**:

1. **Separate Directory Structure**:
   ```
   brand/windchasers/
   ├── dashboard/build/     # Dashboard Next.js app (port 4002)
   └── web-agent/build/      # Web-agent Next.js app (port 4003)
   ```

2. **Separate package.json Files**:
   - Dashboard: `brand/windchasers/dashboard/build/package.json`
   - Web-agent: `brand/windchasers/web-agent/build/package.json`

3. **Separate Next.js Configuration**:
   - Dashboard: `brand/windchasers/dashboard/build/next.config.js`
   - Web-agent: `brand/windchasers/web-agent/build/next.config.js`

4. **Separate Ports**:
   - Dashboard: Port **4002** (dev), Port **3003** (production)
   - Web-agent: Port **4003** (dev), Port **3001** (production)

5. **Separate Source Code**:
   - Dashboard: `brand/windchasers/dashboard/build/src/`
   - Web-agent: `brand/windchasers/web-agent/build/src/`

### Web-Agent Widget Page

**Location**: `brand/windchasers/web-agent/build/src/app/widget/page.tsx`

```tsx
export default function WidgetPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/chat'
  
  return (
    <div style={{ width: '100vw', height: '100vh', ... }}>
      <ChatWidget apiUrl={apiUrl} widgetStyle="searchbar" />
    </div>
  )
}
```

This page serves the widget at `/widget` route on the web-agent server.

---

## 3. Why Dashboard Appears to Start Web-Agent

### The `concurrently` Script

**Location**: `brand/windchasers/dashboard/build/package.json`

```json
{
  "scripts": {
    "dev": "concurrently -n \"dashboard,web-agent\" -c \"cyan,magenta\" \"npm run dev:dashboard\" \"npm run dev:web-agent\"",
    "dev:dashboard": "next dev -p 4002",
    "dev:web-agent": "cd ../../web-agent/build && npm run dev"
  }
}
```

### Explanation

When you run `npm run dev` from the dashboard directory:

1. **`concurrently`** starts **two separate processes**:
   - Process 1: `npm run dev:dashboard` → Starts Next.js on port 4002
   - Process 2: `npm run dev:web-agent` → Changes directory and starts Next.js on port 4003

2. **Both processes run simultaneously** in the same terminal with colored output:
   - Dashboard: Cyan color
   - Web-agent: Magenta color

3. **This is a development convenience**, not a dependency:
   - The dashboard **can run independently** without the web-agent
   - The web-agent **can run independently** without the dashboard
   - They communicate only via HTTP (iframe + API calls)

### Alternative: Running Separately

You can run them independently:

```bash
# Terminal 1: Dashboard only
cd brand/windchasers/dashboard/build
npm run dev:dashboard

# Terminal 2: Web-agent only
cd brand/windchasers/web-agent/build
npm run dev
```

---

## 4. Architecture Comparison: PROXe vs Windchasers

### PROXe Setup

**Dashboard**: `brand/proxe/dashboard/build/`
- Port: **4000** (dev)
- **Does NOT** auto-start web-agent
- `package.json` only has dashboard scripts:
  ```json
  {
    "scripts": {
      "dev": "next dev -p 4000"
    }
  }
  ```

**Web-Agent**: `brand/proxe/web-agent/` (note: no `build/` subdirectory)
- Port: **4001** (dev)
- Must be started separately

### Windchasers Setup

**Dashboard**: `brand/windchasers/dashboard/build/`
- Port: **4002** (dev)
- **Auto-starts web-agent** via `concurrently`
- `package.json` includes both:
  ```json
  {
    "scripts": {
      "dev": "concurrently ... \"npm run dev:dashboard\" \"npm run dev:web-agent\""
    }
  }
  ```
- Also has brand-level `package.json` at `brand/windchasers/package.json` that can start both

**Web-Agent**: `brand/windchasers/web-agent/build/`
- Port: **4003** (dev)
- Can run independently or via dashboard's `concurrently` script

---

## 5. Communication Flow

### Preview Display Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard (Port 4002)                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ WebAgentSettingsClient Component                       │ │
│ │                                                         │ │
│ │  <iframe src="http://localhost:4003/widget">           │ │
│ │    ┌─────────────────────────────────────────────┐     │ │
│ │    │ Web-Agent (Port 4003)                       │     │ │
│ │    │ ┌───────────────────────────────────────┐   │     │ │
│ │    │ │ /widget page                           │   │     │ │
│ │    │ │ <ChatWidget />                         │   │     │ │
│ │    │ └───────────────────────────────────────┘   │     │ │
│ │    └─────────────────────────────────────────────┘     │ │
│ │  </iframe>                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### API Communication

When the widget makes API calls:

1. **Widget** (inside iframe) → Calls `/api/chat`
2. **Request goes to**: `http://localhost:4003/api/chat` (web-agent server)
3. **Web-agent** processes the request and responds
4. **Widget** receives response and updates UI

**Note**: The API calls are made to the **web-agent server**, not the dashboard server.

---

## 6. CORS and Security

### Middleware Configuration

**Location**: `brand/windchasers/web-agent/build/src/middleware.ts`

The web-agent middleware handles CORS for iframe embedding:

```typescript
// For widget page, set CSP dynamically based on environment
if (isWidget) {
  if (isDev) {
    // Remove CSP restriction in development to allow any localhost origin
    response.headers.delete('Content-Security-Policy')
    response.headers.delete('X-Frame-Options')
  } else {
    // Production: Set restrictive CSP
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://proxe.windchasers.in https://windchasers.in"
    )
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }
}
```

### Development vs Production

- **Development**: Allows iframe embedding from any localhost origin
- **Production**: Restricts iframe embedding to specific domains

---

## 7. Key Takeaways

### ✅ Confirmed Architecture

1. **Iframe Embedding**: Dashboard uses `<iframe>` to display web-agent preview
2. **Separate Apps**: Web-agent is a completely separate Next.js application
3. **Different Ports**: Dashboard (4002) and Web-agent (4003) run on different ports
4. **HTTP Communication**: They communicate via HTTP requests (iframe + API)

### ✅ Why Dashboard "Starts" Web-Agent

- **Convenience Script**: `concurrently` runs both processes for easier development
- **Not a Dependency**: Dashboard can run without web-agent (preview just won't work)
- **Optional**: You can run them separately if needed

### ✅ Production Behavior

- Dashboard: `/var/www/windchasers-proxe/` (Port 3003)
- Web-agent: `/var/www/windchasers-web-agent/` (Port 3001)
- Preview uses `NEXT_PUBLIC_WEB_AGENT_URL` environment variable or defaults to production URL

---

## 8. Troubleshooting

### Preview Not Showing?

1. **Check if web-agent is running**:
   ```bash
   # Should be accessible at:
   http://localhost:4003/widget
   ```

2. **Check port configuration**:
   - Dashboard expects web-agent on port **4003** (dev) or **3001** (production)
   - Verify web-agent is actually running on that port

3. **Check browser console**:
   - Look for CORS errors
   - Look for iframe loading errors
   - Check network tab for failed requests

4. **Verify environment variable**:
   - If `NEXT_PUBLIC_WEB_AGENT_URL` is set, ensure it's correct
   - In development, it should default to `http://localhost:4003`

### Running Separately

If you want to run them separately:

```bash
# Terminal 1: Dashboard
cd brand/windchasers/dashboard/build
npm run dev:dashboard

# Terminal 2: Web-agent
cd brand/windchasers/web-agent/build
npm run dev
```

Then access:
- Dashboard: http://localhost:4002
- Web-agent widget: http://localhost:4003/widget
- Preview: http://localhost:4002/dashboard/settings/web-agent

---

## Conclusion

The web-agent preview architecture is straightforward:
- **Iframe embedding** of a separate Next.js application
- **Convenience script** (`concurrently`) runs both for development
- **No tight coupling**—both apps can run independently
- **HTTP-based communication** between dashboard and web-agent

This architecture allows for:
- Independent development and deployment
- Easy testing of widget in isolation
- Flexible deployment (same server or different servers)
- Clear separation of concerns
