import type { View } from '../App'

interface Props {
  onNav: (v: View) => void
}

export default function UserTypeSelection({ onNav }: Props) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-foreground mb-3">What are you here to do?</h1>
          <p className="text-muted-foreground">Choose your path — you can always switch later.</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => onNav('upload')}
            className="group bg-card border-2 border-border hover:border-primary rounded-2xl p-8 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M5 23V9l8-6 8 6v14" stroke="#3730A3" strokeWidth="1.6" strokeLinejoin="round" />
                <rect x="9" y="14" width="8" height="9" rx="1.5" stroke="#3730A3" strokeWidth="1.6" />
              </svg>
            </div>
            <h2 className="font-semibold text-xl text-foreground mb-2">Job Seeker</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Check, improve, and tailor your resume for the roles you want.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
              Improve My Resume
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

        </div>
      </div>
    </div>
  )
}
