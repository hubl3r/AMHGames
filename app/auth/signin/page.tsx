// app/auth/signin/page.tsx

'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { Github, Mail } from 'lucide-react'

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleOAuth = async (provider: string) => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/' })
  }

  const providers = [
    { id: 'github', label: 'Continue with GitHub', icon: Github },
    { id: 'google', label: 'Continue with Google', icon: Mail },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          
          <div className="text-center mb-8">
            <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}>
              Sign In
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to track scores and challenge friends
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {providers.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleOAuth(id)}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {loading === id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icon size={18} />
                )}
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">
              ← Back to games
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
