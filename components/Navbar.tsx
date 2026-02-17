'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Gamepad2, User, LogIn } from 'lucide-react'

const categories = [
  { name: 'Paper', href: '#paper', color: '#f59e0b' },
  { name: 'Puzzle', href: '#puzzle', color: '#a855f7' },
  { name: 'Arcade', href: '#arcade', color: '#ec4899' },
  { name: 'Board', href: '#board', color: '#10b981' },
  { name: 'Coming Soon', href: '#coming', color: '#3b82f6' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  // TODO: replace with useSession() from next-auth once configured
  const user = null

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(8, 11, 20, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Gamepad2
                size={28}
                className="text-purple-400 group-hover:text-purple-300 transition-colors"
              />
              <div className="absolute inset-0 blur-md opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ background: '#a855f7' }} />
            </div>
            <span
              className="text-2xl tracking-widest text-white group-hover:text-purple-200 transition-colors"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.15em' }}
            >
              AMH<span className="text-purple-400">GAMES</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {categories.map((cat) => (
              <a
                key={cat.name}
                href={cat.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/5 relative group"
              >
                <span className="relative z-10">{cat.name}</span>
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 group-hover:w-4 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: cat.color }}
                />
              </a>
            ))}
          </div>

          {/* Auth + mobile */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium glass-card text-gray-200 hover:text-white"
              >
                <User size={16} />
                <span>Profile</span>
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))',
                  border: '1px solid rgba(168,85,247,0.4)',
                  color: 'white',
                }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 pt-2 space-y-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {categories.map((cat) => (
            <a
              key={cat.name}
              href={cat.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: cat.color }}
              />
              {cat.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
