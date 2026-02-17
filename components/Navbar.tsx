'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, Gamepad2, User, LogIn, LogOut, ChevronDown } from 'lucide-react'
import Image from 'next/image'

const categories = [
  { name: 'Paper', href: '/#paper', color: '#f59e0b' },
  { name: 'Puzzle', href: '/#puzzle', color: '#a855f7' },
  { name: 'Arcade', href: '/#arcade', color: '#ec4899' },
  { name: 'Board', href: '/#board', color: '#10b981' },
  { name: 'Coming Soon', href: '/#coming', color: '#3b82f6' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(8, 11, 20, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 size={28} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-2xl text-white group-hover:text-purple-200 transition-colors" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.15em' }}>
              AMH<span className="text-purple-400">GAMES</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {categories.map((cat) => (
              <a key={cat.name} href={cat.href} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all hover:bg-white/5 relative group">
                {cat.name}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 group-hover:w-4 h-0.5 rounded-full transition-all duration-300" style={{ background: cat.color }} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="avatar" width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <User size={14} className="text-purple-300" />
                    </div>
                  )}
                  <span className="text-sm text-gray-200 hidden sm:block max-w-24 truncate">{session.user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden py-1" style={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                      <User size={14} /> Profile
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="my-1" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/signin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(168,85,247,0.4)', color: 'white' }}>
                <LogIn size={16} /><span>Sign In</span>
              </Link>
            )}
            <button className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {categories.map((cat) => (
            <a key={cat.name} href={cat.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />{cat.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
