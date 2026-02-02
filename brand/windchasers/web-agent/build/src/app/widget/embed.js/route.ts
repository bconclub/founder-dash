import { NextResponse } from 'next/server';

export async function GET() {
  const embedCode = `
(function() {
  if (document.getElementById('wc-chat-widget')) return;

  var iframe = document.createElement('iframe');
  iframe.id = 'wc-chat-widget';
  iframe.src = 'https://agent.windchasers.in/widget/bubble';
  iframe.setAttribute('allowtransparency', 'true');

  // Fixed size iframe - small enough to just contain the bubble button area
  // This ensures clicks pass through to the host page everywhere except the bubble
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100px;height:100px;border:none;background:transparent;z-index:999999;';

  // Listen for messages from iframe to resize for chat modal
  window.addEventListener('message', function(e) {
    if (e.data === 'wc-chat-open') {
      iframe.style.width = '450px';
      iframe.style.height = '700px';
    } else if (e.data === 'wc-chat-close') {
      iframe.style.width = '100px';
      iframe.style.height = '100px';
    }
  });

  document.body.appendChild(iframe);
})();
  `;
  
  return new NextResponse(embedCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}