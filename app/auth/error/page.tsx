'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const errors: Record<string, string> = {
  Configuration:  'There is a problem with the server configuration.',
  AccessDenied:   'You do not have permission to sign in.',
  Verification:   'The sign in link is no longer valid.',
  Default:        'An error occurred while signing in.',
}

function ErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') ?? 'Default'
  const message = errors[error] ?? errors.Default

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-4xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Sign In Error
        </h1>
        <p className="text-gray-400 mb-8">{message}</p>
        <Link href="/auth/signin" className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 inline-block"
          style={{ background: 'linear-gradient(135deg, #a855f7, #6d28d9)' }}>
          Try Again
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
