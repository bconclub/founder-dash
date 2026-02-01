import { NextResponse } from 'next/server';

export async function GET() {
  const embedCode = `
(function() {
  // Prevent duplicate injection
  if (document.getElementById('windchasers-chat-button')) return;
  
  // Create button
  const button = document.createElement('button');
  button.id = 'windchasers-chat-button';
  button.innerHTML = '<img src="https://pilot.windchasers.in/Windchasers Icon.png" width="30" alt="Windchasers" style="border-radius: 50%;">';
  button.title = 'Chat with Windchasers';
  button.onclick = () => window.open('https://agent.windchasers.in/widget', '_blank', 'width=400,height=600');
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#C5A572',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: '10000',
    fontSize: '24px',
    transition: 'transform 0.2s',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  button.onmouseover = () => button.style.transform = 'scale(1.1)';
  button.onmouseout = () => button.style.transform = 'scale(1)';
  
  // Append to body
  document.body.appendChild(button);
  
  // Mobile responsive
  const style = document.createElement('style');
  style.textContent = \`
    @media (max-width: 768px) {
      #windchasers-chat-button {
        bottom: 15px !important;
        right: 15px !important;
        width: 56px !important;
        height: 56px !important;
      }
    }
  \`;
  document.head.appendChild(style);
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