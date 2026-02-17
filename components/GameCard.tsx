'use client'

import Link from 'next/link'
import { Users, User, Lock } from 'lucide-react'

interface GameCardProps {
  title: string
  description: string
  href: string
  emoji: string
  color: string
  players: 'solo' | 'multi' | 'both'
  status?: 'live' | 'coming'
  tags?: string[]
}

export function GameCard({
  title,
  description,
  href,
  emoji,
  color,
  players,
  status = 'live',
  tags = [],
}: GameCardProps) {
  const isComingSoon = status === 'coming'

  const card = (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.08)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Hover glow border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}15, transparent)`,
          border: `1px solid ${color}40`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
          opacity: 0,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      <div className="p-6">
        {/* Emoji + status */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            {isComingSoon ? '🔒' : emoji}
          </div>

          {/* Player mode badge */}
          <div className="flex flex-col items-end gap-1">
            {!isComingSoon && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {players === 'solo' && <><User size={10} /> Solo</>}
                {players === 'multi' && <><Users size={10} /> Multiplayer</>}
                {players === 'both' && <><Users size={10} /> 1-2 Players</>}
              </span>
            )}
            {isComingSoon && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93c5fd',
                }}
              >
                <Lock size={10} /> Soon
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-xl mb-2 text-white group-hover:text-white/90 transition-colors"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors leading-relaxed mb-4">
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{
                  background: `${color}12`,
                  color: `${color}cc`,
                  border: `1px solid ${color}25`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Play button */}
        {!isComingSoon && (
          <div
            className="mt-4 w-full py-2 rounded-lg text-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}15)`,
              border: `1px solid ${color}50`,
              color: 'white',
            }}
          >
            Play Now →
          </div>
        )}
      </div>
    </div>
  )

  if (isComingSoon) return card
  return <Link href={href} className="block">{card}</Link>
}
