import { useState } from 'react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import UserTypeSelection from './components/UserTypeSelection'
import ResumeUpload from './components/ResumeUpload'
import ProcessingScreen from './components/ProcessingScreen'
import ATSDashboard from './components/ATSDashboard'
import JDMatch from './components/JDMatch'
import Recommendations from './components/Recommendations'
import ResumeEditor from './components/ResumeEditor'
import BeforeAfter from './components/BeforeAfter'
import ExportModal from './components/ExportModal'
import RecruiterPreview from './components/RecruiterPreview'

export type View =
  | 'landing'
  | 'user-type'
  | 'upload'
  | 'processing'
  | 'dashboard'
  | 'jd-match'
  | 'recommendations'
  | 'editor'
  | 'before-after'
  | 'recruiter'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [showExport, setShowExport] = useState(false)

  const nav = (v: View) => {
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header view={view} onNav={nav} />
      <main>
        {view === 'landing' && <LandingPage onNav={nav} />}
        {view === 'user-type' && <UserTypeSelection onNav={nav} />}
        {view === 'upload' && <ResumeUpload onNav={nav} />}
        {view === 'processing' && <ProcessingScreen onNav={nav} />}
        {view === 'dashboard' && (
          <ATSDashboard onNav={nav} onExport={() => setShowExport(true)} />
        )}
        {view === 'jd-match' && <JDMatch onNav={nav} />}
        {view === 'recommendations' && <Recommendations onNav={nav} />}
        {view === 'editor' && (
          <ResumeEditor onNav={nav} onExport={() => setShowExport(true)} />
        )}
        {view === 'before-after' && <BeforeAfter onNav={nav} />}
        {view === 'recruiter' && <RecruiterPreview onNav={nav} />}
      </main>
      {showExport && <ExportModal onClose={() => setShowExport(false)} onNav={nav} />}
    </div>
  )
}
