import { CategorySection } from '@/components/CategorySection'

const categories = [
  {
    id: 'paper',
    name: 'Paper Games',
    description: 'Classic pen-and-paper games brought to life',
    color: '#f59e0b',
    icon: '📄',
    games: [
      {
        title: 'Dots & Boxes',
        description: 'Connect dots to claim boxes. Outwit your opponent in this classic grid game.',
        href: '/paper/dots-and-boxes',
        emoji: '🔲',
        players: 'both' as const,
        status: 'live' as const,
        tags: ['2 Player', 'Strategy'],
      },
      {
        title: 'Tic Tac Toe',
        description: 'The timeless classic. Simple to learn, endlessly satisfying.',
        href: '/paper/tic-tac-toe',
        emoji: '❌',
        players: 'both' as const,
        status: 'coming' as const,
        tags: ['2 Player'],
      },
      {
        title: 'Battleship',
        description: 'Hide your fleet and sink your opponent\'s ships before they sink yours.',
        href: '/paper/battleship',
        emoji: '🚢',
        players: 'multi' as const,
        status: 'coming' as const,
        tags: ['2 Player', 'Strategy'],
      },
    ],
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    description: 'Sharpen your mind with spatial and logic challenges',
    color: '#a855f7',
    icon: '🧩',
    games: [
      {
        title: 'Jigsaw',
        description: 'Piece together stunning landscapes in this beautifully crafted jigsaw puzzle game.',
        href: '/puzzle/jigsaw',
        emoji: '🧩',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Relaxing', 'Images'],
      },
      {
        title: 'Mastermind',
        description: 'Crack the code using logic and deduction. How many guesses will it take?',
        href: '/puzzle/mastermind',
        emoji: '🔮',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Logic', 'Code Breaking'],
      },
      {
        title: 'Hexa Puzzle',
        description: 'Fit hexagonal pieces onto the board in this satisfying spatial puzzle.',
        href: '/puzzle/hexa',
        emoji: '⬡',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Spatial'],
      },
      {
        title: 'Shredder',
        description: 'Reassemble a shredded document. Can you piece it back together?',
        href: '/puzzle/shredder',
        emoji: '🗂️',
        players: 'solo' as const,
        status: 'coming' as const,
        tags: ['Solo', 'Tricky'],
      },
    ],
  },
  {
    id: 'arcade',
    name: 'Arcade',
    description: 'Fast-paced action games with that classic arcade feel',
    color: '#ec4899',
    icon: '🕹️',
    games: [
      {
        title: 'Pac-Man',
        description: 'Navigate the maze, eat the dots, and outrun the ghosts. A true classic.',
        href: '/arcade/pacman',
        emoji: '👾',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Classic', 'High Score'],
      },
      {
        title: 'JezzBall',
        description: 'Trap the bouncing balls by drawing walls. A forgotten gem brought back.',
        href: '/arcade/jezzball',
        emoji: '🎱',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Retro'],
      },
      {
        title: 'Match 3',
        description: 'Swap and match gems to clear the board in this cosmic puzzle arcade game.',
        href: '/arcade/match3',
        emoji: '💎',
        players: 'solo' as const,
        status: 'live' as const,
        tags: ['Solo', 'Casual'],
      },
      {
        title: 'Snake',
        description: 'Grow your snake without hitting the walls or yourself.',
        href: '/arcade/snake',
        emoji: '🐍',
        players: 'solo' as const,
        status: 'coming' as const,
        tags: ['Solo', 'Classic'],
      },
    ],
  },
  {
    id: 'board',
    name: 'Board Games',
    description: 'Strategy and skill in digital board game form',
    color: '#10b981',
    icon: '♟️',
    games: [
      {
        title: 'Hex',
        description: 'Connect your sides before your opponent. A deep strategy game on a hex grid.',
        href: '/board/hex',
        emoji: '🔷',
        players: 'both' as const,
        status: 'live' as const,
        tags: ['2 Player', 'Strategy', 'Abstract'],
      },
      {
        title: 'Checkers',
        description: 'The classic board game of jumps and kings.',
        href: '/board/checkers',
        emoji: '🔴',
        players: 'both' as const,
        status: 'coming' as const,
        tags: ['2 Player', 'Classic'],
      },
      {
        title: 'Reversi',
        description: 'Flip your opponent\'s pieces to dominate the board.',
        href: '/board/reversi',
        emoji: '⚫',
        players: 'both' as const,
        status: 'coming' as const,
        tags: ['2 Player', 'Strategy'],
      },
    ],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 text-center overflow-hidden">
        {/* Big background text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <span
            className="text-[20vw] font-black text-white/[0.02] leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            AMH
          </span>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
              color: '#c084fc',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            8 Games Available · More Coming Soon
          </div>

          <h1
            className="text-7xl md:text-9xl text-white mb-6 leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            AMH
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #3b82f6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              GAMES
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Classic games reimagined — play solo to sharpen your mind,
            or challenge friends in real-time multiplayer.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="#puzzle"
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6d28d9)',
                boxShadow: '0 0 30px rgba(168,85,247,0.3)',
              }}
            >
              Browse Games
            </a>
            <a
              href="/auth/signin"
              className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Create Account
            </a>
          </div>
        </div>

        {/* Stat pills */}
        <div className="relative z-10 flex justify-center gap-6 mt-16 flex-wrap">
          {[
            { label: 'Games', value: '8+' },
            { label: 'Categories', value: '4' },
            { label: 'Multiplayer', value: 'Coming' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-6 py-3 rounded-xl text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px max-w-7xl mx-auto"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />

      {/* Game categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {categories.map((cat) => (
          <CategorySection key={cat.id} {...cat} />
        ))}
      </div>

      {/* Footer */}
      <footer
        className="mt-16 py-8 text-center text-sm text-gray-600"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p>AMH Games · Built with Next.js · Deployed on Vercel</p>
      </footer>
    </div>
  )
}
