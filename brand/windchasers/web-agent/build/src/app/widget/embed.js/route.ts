import { NextResponse } from 'next/server';

export async function GET() {
  const embedCode = `
(function() {
  if (document.getElementById('wc-chat-widget')) return;

  var iframe = document.createElement('iframe');
  iframe.id = 'wc-chat-widget';
  iframe.src = 'https://agent.windchasers.in/widget/bubble';
  iframe.setAttribute('allowtransparency', 'true');

  // Check if mobile
  var isMobile = window.innerWidth <= 768;

  // Desktop: fixed size for bubble + chatbox
  // Mobile: full viewport size for fullscreen chat
  if (isMobile) {
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;background:transparent;z-index:2147483647;';
  } else {
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:450px;height:650px;border:none;background:transparent;z-index:2147483647;';
  }

  // Handle resize to switch between mobile/desktop
  window.addEventListener('resize', function() {
    var nowMobile = window.innerWidth <= 768;
    if (nowMobile) {
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.bottom = 'auto';
      iframe.style.right = 'auto';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
    } else {
      iframe.style.top = 'auto';
      iframe.style.left = 'auto';
      iframe.style.bottom = '0';
      iframe.style.right = '0';
      iframe.style.width = '450px';
      iframe.style.height = '650px';
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