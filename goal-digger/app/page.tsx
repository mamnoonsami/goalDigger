import Link from 'next/link'
import { Button } from '../components/ui/Button'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-1 text-text-primary">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(22,163,74,0.22) 0%, transparent 65%)',
        }}
      />

      {/* Topbar */}
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm shadow-md shadow-accent/30">⚽</span>
          <span className="text-base font-bold tracking-tight">Goal Digger</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center md:px-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
          ⚡ Soccer squad management, reimagined
        </div>

        <h1 className="mb-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          Organise matches.
          <br />
          <span style={{ color: 'var(--accent)' }}>Balance teams.</span>
          <br />
          Win auctions.
        </h1>

        <p className="mb-10 max-w-xl text-lg leading-relaxed text-text-muted">
          Goal Digger helps your soccer community schedule games, auto-balance squads by skill rating, and run live player auctions for tournaments — all in one place.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg">
              Start for free →
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            '⚽  Match scheduling',
            '⚖️  Auto team balancing',
            '🏆  Tournament management',
            '💰  Live player auction',
            '📊  Player stats & leaderboard',
            '📱  Mobile friendly',
          ].map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-text-muted"
            >
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex justify-center border-t border-border/50 px-6 py-6">
        <p className="text-sm text-text-muted">© 2026 Goal Digger. Built with ⚽ and ❤️</p>
      </footer>
    </div>
  )
}
