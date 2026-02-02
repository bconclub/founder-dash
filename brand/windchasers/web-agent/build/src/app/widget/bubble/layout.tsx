import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat Widget',
}

export default function BubbleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ background: 'transparent' }}>
      <body style={{
        background: 'transparent',
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0
      }}>
        {children}
      </body>
    </html>
  )
}
