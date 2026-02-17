# AMH Games

A collection of classic games reimagined with modern design — built with Next.js, React, and Tailwind CSS. Deployed on Vercel.

## Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS
- **Auth**: NextAuth.js (GitHub + Google OAuth)
- **Deployment**: Vercel
- **Design**: Glassmorphism dark theme

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Setting Up Auth

Create a `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# GitHub OAuth (create at github.com/settings/developers)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Google OAuth (create at console.cloud.google.com)
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

Then add the NextAuth API route at `app/api/auth/[...nextauth]/route.ts`.

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Add environment variables in Vercel dashboard
5. Deploy — your site will be live at `amhgames.vercel.app`

## Categories

| Category | Color | Games |
|----------|-------|-------|
| Paper | Amber | Dots & Boxes, Tic Tac Toe, Battleship |
| Puzzle | Purple | Jigsaw, Mastermind, Hexa, Shredder |
| Arcade | Pink | Pac-Man, JezzBall, Match 3, Snake |
| Board | Green | Hex, Checkers, Reversi |

## Project Structure

```
app/
  page.tsx              # Landing page
  layout.tsx            # Root layout + navbar
  globals.css           # Global styles + CSS vars
  auth/signin/page.tsx  # Sign in page
  paper/                # Paper games
  puzzle/               # Puzzle games
  arcade/               # Arcade games
  board/                # Board games
components/
  Navbar.tsx            # Sticky nav with auth
  GameCard.tsx          # Game card component
  CategorySection.tsx   # Category with grid
```
