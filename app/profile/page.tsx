import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { User, Trophy, Gamepad2 } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-16">

      {/* Profile header */}
      <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-6">
          {session.user?.image ? (
            <Image src={session.user.image} alt="avatar" width={80} height={80} className="rounded-full ring-2 ring-purple-500/30" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center ring-2 ring-purple-500/30">
              <User size={32} className="text-purple-300" />
            </div>
          )}
          <div>
            <h1 className="text-4xl text-white mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
              {session.user?.name}
            </h1>
            <p className="text-gray-500 text-sm">{session.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Games Played', value: '0', icon: Gamepad2, color: '#a855f7' },
          { label: 'High Scores', value: '0', icon: Trophy, color: '#f59e0b' },
          { label: 'Wins', value: '0', icon: Trophy, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <stat.icon size={24} className="mx-auto mb-2" style={{ color: stat.color }} />
            <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent scores placeholder */}
      <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-2xl text-white mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
          Recent Games
        </h2>
        <div className="text-center py-12 text-gray-600">
          <Gamepad2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No games played yet. Go play something!</p>
        </div>
      </div>
    </div>
  )
}
