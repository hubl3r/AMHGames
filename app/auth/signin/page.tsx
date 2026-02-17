'use client'

import Link from 'next/link'
import { Github, Mail } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl text-white mb-2"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}
            >
              Sign In
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to track scores and challenge friends
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all hover:scale-[1.02] text-white"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              onClick={() => {/* signIn('github') */}}
            >
              <Github size={20} />
              Continue with GitHub
            </button>

            <button
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all hover:scale-[1.02] text-white"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              onClick={() => {/* signIn('google') */}}
            >
              <Mail size={20} />
              Continue with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              No account needed to play solo games.{' '}
            </span>
            <Link href="/" className="text-purple-400 text-sm hover:text-purple-300">
              Browse games →
            </Link>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Authentication powered by NextAuth.js · Configure providers in{' '}
          <code className="text-gray-500">.env.local</code>
        </p>
      </div>
    </div>
  )
}
