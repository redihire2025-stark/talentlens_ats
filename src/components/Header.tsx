import { useState } from 'react'
import type { View } from '../App'

interface Props {
  view: View
  onNav: (v: View) => void
}

const navLinks: Array<{ label: string; view: View }> = [
  { label: 'Resume Checker', view: 'upload' },
  { label: 'Resume Matcher', view: 'jd-match' },
  { label: 'Resume Optimizer', view: 'editor' },
]

export default function Header({ view, onNav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isLanding = view === 'landing'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => onNav('landing')}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {/* Document outline */}
                <path d="M5 3h7l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="white" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
                {/* Folded corner */}
                <path d="M12 3v3h3" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
                {/* Scan line — animated feel via gradient opacity */}
                <line x1="4" y1="10" x2="16" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
                {/* Spark dot on scan line */}
                <circle cx="13.5" cy="10" r="1.5" fill="white" />
                {/* Text lines below scan */}
                <line x1="7" y1="13" x2="13" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <line x1="7" y1="15.5" x2="11" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <span className="font-semibold text-foreground tracking-tight text-[15px]">TalentLens</span>
          </button>

          {/* Desktop nav */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNav(item.view)}
                  className="px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            {isLanding ? (
              <button
                onClick={() => onNav('upload')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
              >
                Get Started
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => onNav('dashboard')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dashboard
              </button>
            )}

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

        {/* Mobile menu */}
        {isLanding && menuOpen && (
          <div className="md:hidden border-t border-border py-3">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => { onNav(item.view); setMenuOpen(false) }}
                className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-border">
              <button
                onClick={() => { onNav('upload'); setMenuOpen(false) }}
                className="w-full py-2.5 text-white text-sm font-semibold rounded-lg"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
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
