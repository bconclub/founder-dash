# Windchasers Web-Agent Widget Embedding Guide

This guide explains how to embed the Windchasers chat widget on your live website.

## Quick Embed (Iframe Method)

Add this code snippet to your website's HTML, typically in the `<body>` section or before the closing `</body>` tag:

```html
<!-- Windchasers Chat Widget -->
<iframe 
  id="windchasers-chat-widget"
  src="https://pilot.windchasers.in/widget"
  style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    display: none;
  "
  allow="microphone; camera"
  title="Windchasers Chat Widget"
></iframe>

<script>
  // Show widget when user interacts (optional - remove if you want it always visible)
  document.addEventListener('DOMContentLoaded', function() {
    const widget = document.getElementById('windchasers-chat-widget');
    
    // Show widget after a delay or on scroll
    setTimeout(function() {
      widget.style.display = 'block';
    }, 3000); // Show after 3 seconds
    
    // Or show on scroll
    // let scrolled = false;
    // window.addEventListener('scroll', function() {
    //   if (!scrolled) {
    //     widget.style.display = 'block';
    //     scrolled = true;
    //   }
    // });
  });
</script>
```

## Alternative: Floating Button Method

If you prefer a floating button that opens the widget:

```html
<!-- Floating Button -->
<button 
  id="windchasers-chat-button"
  onclick="toggleWindchasersWidget()"
  style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #FF6B35;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-size: 24px;
  "
  title="Chat with Windchasers"
>
  💬
</button>

<!-- Widget Iframe -->
<iframe 
  id="windchasers-chat-widget"
  src="https://pilot.windchasers.in/widget"
  style="
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    display: none;
  "
  allow="microphone; camera"
  title="Windchasers Chat Widget"
></iframe>

<script>
  function toggleWindchasersWidget() {
    const widget = document.getElementById('windchasers-chat-widget');
    const button = document.getElementById('windchasers-chat-button');
    
    if (widget.style.display === 'none' || widget.style.display === '') {
      widget.style.display = 'block';
      button.textContent = '✕';
    } else {
      widget.style.display = 'none';
      button.textContent = '💬';
    }
  }
  
  // Close widget when clicking outside (optional)
  document.addEventListener('click', function(event) {
    const widget = document.getElementById('windchasers-chat-widget');
    const button = document.getElementById('windchasers-chat-button');
    
    if (widget.style.display === 'block' && 
        !widget.contains(event.target) && 
        !button.contains(event.target)) {
      widget.style.display = 'none';
      button.textContent = '💬';
    }
  });
</script>
```

## Configuration

### Replace the Domain

**Widget Domain**: `https://pilot.windchasers.in/widget`

The widget is hosted at `pilot.windchasers.in`. Use this domain in all embed codes below.

### Styling Customization

You can customize the widget appearance by modifying the `style` attributes:

- **Position**: Change `bottom` and `right` values to position the widget
- **Size**: Adjust `width` and `height` (recommended: 400px width, 600px height)
- **Border Radius**: Modify `border-radius` for rounded corners
- **Z-Index**: Ensure it's above other content (9999 is recommended)

### Mobile Responsiveness

For mobile devices, you may want to make the widget fullscreen:

```css
@media (max-width: 768px) {
  #windchasers-chat-widget {
    width: 100vw !important;
    height: 100vh !important;
    bottom: 0 !important;
    right: 0 !important;
    border-radius: 0 !important;
  }
}
```

## Testing

1. **Local Testing**: Before deploying to production, test the widget on a staging environment
2. **Cross-Browser**: Test on Chrome, Firefox, Safari, and Edge
3. **Mobile Testing**: Verify it works on mobile devices
4. **Lead Capture**: Test the full flow - chat, form submission, and verify leads appear in the dashboard

## Troubleshooting

### Widget Not Loading
- Check that the web-agent URL is correct and accessible
- Verify CORS settings allow your domain
- Check browser console for errors

### Widget Not Capturing Leads
- Verify Supabase connection is working
- Check web-agent logs on VPS: `pm2 logs windchasers-web-agent`
- Ensure database migrations have been run

### Styling Issues
- Ensure z-index is high enough (9999+)
- Check for CSS conflicts with your site's styles
- Verify iframe dimensions are appropriate

## Support

For issues or questions, check:
- Web-agent logs: `pm2 logs windchasers-web-agent` on VPS
- Dashboard lead inbox to verify leads are being captured
- Supabase dashboard for database connectivity
