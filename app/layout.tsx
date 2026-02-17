import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'AMH Games',
  description: 'Classic games reimagined — play solo or challenge friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Ambient background orbs */}
        <div className="orb w-96 h-96 top-0 left-1/4 opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="orb w-80 h-80 top-1/3 right-1/4 opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="orb w-64 h-64 bottom-1/4 left-1/3 opacity-10"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

        <div className="relative z-10">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
