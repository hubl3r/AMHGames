import { GameCard } from './GameCard'

interface Game {
  title: string
  description: string
  href: string
  emoji: string
  players: 'solo' | 'multi' | 'both'
  status?: 'live' | 'coming'
  tags?: string[]
}

interface CategorySectionProps {
  id: string
  name: string
  description: string
  color: string
  icon: string
  games: Game[]
}

export function CategorySection({
  id,
  name,
  description,
  color,
  icon,
  games,
}: CategorySectionProps) {
  return (
    <section id={id} className="py-16 scroll-mt-20">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}
        >
          {icon}
        </div>
        <div>
          <h2
            className="text-4xl text-white leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em' }}
          >
            {name}
          </h2>
        </div>
        <div
          className="flex-1 h-px ml-4"
          style={{ background: `linear-gradient(90deg, ${color}50, transparent)` }}
        />
      </div>

      <p className="text-gray-500 text-sm mb-8 pl-14">{description}</p>

      {/* Game grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.title}
            {...game}
            color={color}
          />
        ))}
      </div>
    </section>
  )
}
