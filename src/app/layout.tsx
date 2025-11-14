import type { Metadata } from 'next'
import { Exo_2, Zen_Dots } from 'next/font/google'
import './globals.css'

const exo2 = Exo_2({ 
  subsets: ['latin'],
  variable: '--font-exo-2',
})
const zenDots = Zen_Dots({ 
  subsets: ['latin'],
  weight: '400',
  variable: '--font-zen-dots',
})

export const metadata: Metadata = {
  title: 'PROXe HQ',
  description: 'Dashboard for managing leads, bookings, and metrics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${exo2.className} ${zenDots.variable}`}>{children}</body>
    </html>
  )
}

