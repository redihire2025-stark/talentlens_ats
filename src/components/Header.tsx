import { useState } from 'react'
import type { View } from '../App'

interface Props {
  view: View
  onNav: (v: View) => void
}

export default function Header({ view, onNav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isLanding = view === 'landing'

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNav('landing')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" fill="none" />
                <circle cx="9" cy="9" r="3.5" fill="white" />
                <line x1="14" y1="14" x2="16.5" y2="16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-foreground tracking-tight text-[15px]">
              TalentLens
            </span>
          </button>

          {/* Desktop nav */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Resume Checker', view: 'upload' as View },
                { label: 'Resume Matcher', view: 'jd-match' as View },
                { label: 'Resume Optimizer', view: 'editor' as View },
                { label: 'For Recruiters', view: 'recruiter' as View },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNav(item.view)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLanding ? (
              <button
                onClick={() => onNav('upload')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={() => onNav('dashboard')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dashboard
              </button>
            )}

            {/* Mobile menu button */}
            {isLanding && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  {menuOpen ? (
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {isLanding && menuOpen && (
          <div className="md:hidden border-t border-border py-3">
            {[
              { label: 'Resume Checker', view: 'upload' as View },
              { label: 'Resume Matcher', view: 'jd-match' as View },
              { label: 'Resume Optimizer', view: 'editor' as View },
              { label: 'For Recruiters', view: 'recruiter' as View },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { onNav(item.view); setMenuOpen(false) }}
                className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-border">
              <button
                onClick={() => { onNav('upload'); setMenuOpen(false) }}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
