import Link from 'next/link'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="m5 10.5 3.2 3.2L15.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const features = [
  {
    number: '01',
    title: 'Build better games',
    description: 'Keep availability, sign-ups, and match details in one place so every game runs smoothly.',
  },
  {
    number: '02',
    title: 'Balance every squad',
    description: 'Use player ratings to create competitive teams automatically, without the awkward group chat debate.',
  },
  {
    number: '03',
    title: 'Make tournaments memorable',
    description: 'Run live auctions, track results, and give your whole community a reason to keep checking in.',
  },
]

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-surface-1 text-text-primary">
      <div className="landing-orb landing-orb-one" aria-hidden="true" />
      <div className="landing-orb landing-orb-two" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between border-b border-border/60 px-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Goal Digger home" className="flex items-center">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-text-muted md:flex" aria-label="Main navigation">
          <a href="#features" className="transition-colors hover:text-text-primary">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-text-primary">How it works</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started <ArrowIcon /></Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(22,163,74,0.12)]" />
              Built for the beautiful game
            </div>

            <h1 className="max-w-xl text-[clamp(2.75rem,8vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-text-primary">
              More game.<br />
              <span className="text-accent">Less admin.</span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
              The simple way to organise matches, create balanced squads, and run tournaments your players will actually remember.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">Start organising <ArrowIcon /></Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">Sign in</Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-2"><CheckIcon /> Free to get started</span>
              <span className="flex items-center gap-2"><CheckIcon /> Made for real teams</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto" aria-label="Goal Digger app preview">
            <div className="absolute -inset-4 rounded-[2rem] bg-accent/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-xs font-medium text-text-muted">Sunday League</span>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">Live season</span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-text-muted">Next match</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Week 08 · Semi-final</h2>
                  </div>
                  <span className="text-xs text-text-muted">Sun, 10:00 AM</span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-border/80 bg-surface-1/60 p-3 sm:gap-4 sm:p-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent">FC</div>
                    <p className="mt-2 text-xs font-medium text-text-muted">The Rovers</p>
                  </div>
                  <div className="text-center"><span className="text-xs font-semibold uppercase tracking-widest text-text-muted">vs</span></div>
                  <div className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/15 text-sm font-bold text-orange-300">AC</div>
                    <p className="mt-2 text-xs font-medium text-text-muted">Atlas FC</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-b border-border/70 pb-3">
                  <p className="text-xs font-medium text-text-muted">Squad balance</p>
                  <p className="text-xs font-semibold text-accent">Excellent <span className="ml-1 text-text-muted">92%</span></p>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['The Rovers', '4.8 avg. rating', '6 players'],
                    ['Atlas FC', '4.7 avg. rating', '6 players'],
                  ].map(([team, , players], index) => (
                    <div key={team} className="flex items-center gap-3">
                      <div className={`h-2 flex-1 overflow-hidden rounded-full bg-surface-3`}><div className={`h-full rounded-full ${index === 0 ? 'w-[88%] bg-accent' : 'w-[84%] bg-orange-300'}`} /></div>
                      <span className="w-[76px] text-right text-[11px] text-text-muted">{team}</span>
                      <span className="hidden w-[74px] text-right text-[11px] text-text-muted sm:block">{players}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border/60 bg-surface-2/35">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px bg-border/50 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
            {[
              ['01', 'Create a match'],
              ['02', 'Invite your people'],
              ['03', 'Balance the squads'],
              ['04', 'Play your best game'],
            ].map(([number, label]) => (
              <div key={number} className="bg-surface-1/90 px-3 py-5 sm:px-5 sm:py-6">
                <p className="text-xs font-semibold tracking-widest text-accent">{number}</p>
                <p className="mt-2 text-sm font-medium text-text-primary sm:text-base">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Everything in one place</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Your team, in sync.</h2>
            <p className="mt-4 text-base leading-7 text-text-muted">From the first sign-up to the final whistle, Goal Digger keeps the details moving so you can focus on the game.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-border bg-surface-2/55 p-6 transition-colors hover:border-accent/40 sm:p-7">
                <span className="text-sm font-semibold text-accent">{feature.number}</span>
                <h3 className="mt-12 text-xl font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <Logo size="sm" />
          <p>© 2026 Goal Digger. Built for better games.</p>
        </div>
      </footer>
    </div>
  )
}
