import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { generateRecommendations } from '@/lib/recommendations/generateRecommendations'

function loadFixture() {
  const resume = buildTestResume({
    summary: null,
    experience: [
      {
        company: 'Acme',
        title: 'Engineer',
        startDate: '2020-01-01',
        endDate: null,
        location: null,
        bullets: ['Worked on stuff.', 'Reduced load time by 35%.'],
      },
    ],
  })
  const recommendations = generateRecommendations({ resume, parserWarnings: [] })
  useEditorStore.getState().load(resume, recommendations)
  return { resume, recommendations }
}

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('ensureDraft() initializes the draft when nothing has been loaded yet', () => {
    const resume = buildTestResume()
    useEditorStore.getState().ensureDraft(resume)
    expect(useEditorStore.getState().draftResume).toEqual(resume)
  })

  it('ensureDraft() does not overwrite an already-loaded draft', () => {
    loadFixture()
    useEditorStore.getState().updateSummaryText('Edited.')
    useEditorStore.getState().ensureDraft(buildTestResume())
    expect(useEditorStore.getState().draftResume!.summary).toBe('Edited.')
  })

  it('load() sets the draft equal to the original and every recommendation to pending', () => {
    const { resume, recommendations } = loadFixture()
    const state = useEditorStore.getState()
    expect(state.draftResume).toEqual(resume)
    for (const r of recommendations) expect(state.statuses[r.id]).toBe('pending')
  })

  it('accepting a bullet-impact recommendation without an edit keeps the original text', () => {
    const { recommendations } = loadFixture()
    const bulletRec = recommendations.find((r) => r.category === 'bullet-impact')!
    useEditorStore.getState().acceptRecommendation(bulletRec.id)
    const state = useEditorStore.getState()
    expect(state.statuses[bulletRec.id]).toBe('accepted')
    expect(state.draftResume!.experience[0]!.bullets[0]).toBe('Worked on stuff.')
  })

  it('accepting a bullet-impact recommendation with an edit applies the edited text to the draft', () => {
    const { recommendations } = loadFixture()
    const bulletRec = recommendations.find((r) => r.category === 'bullet-impact' && r.currentText === 'Worked on stuff.')!
    useEditorStore.getState().setEditedText(bulletRec.id, 'Led a project that reduced onboarding time by 20%.')
    useEditorStore.getState().acceptRecommendation(bulletRec.id)
    expect(useEditorStore.getState().draftResume!.experience[0]!.bullets[0]).toBe(
      'Led a project that reduced onboarding time by 20%.',
    )
  })

  it('rejecting a recommendation never changes the draft resume', () => {
    const { recommendations, resume } = loadFixture()
    useEditorStore.getState().rejectRecommendation(recommendations[0]!.id)
    expect(useEditorStore.getState().draftResume).toEqual(resume)
    expect(useEditorStore.getState().statuses[recommendations[0]!.id]).toBe('rejected')
  })

  it('resetRecommendation() returns a recommendation to pending', () => {
    const { recommendations } = loadFixture()
    useEditorStore.getState().rejectRecommendation(recommendations[0]!.id)
    useEditorStore.getState().resetRecommendation(recommendations[0]!.id)
    expect(useEditorStore.getState().statuses[recommendations[0]!.id]).toBe('pending')
  })

  it('updateSummaryText() edits the draft without touching the original', () => {
    const { resume } = loadFixture()
    useEditorStore.getState().updateSummaryText('New summary.')
    expect(useEditorStore.getState().draftResume!.summary).toBe('New summary.')
    expect(resume.summary).toBeNull()
  })

  it('recalculate() produces a live ATS score for the current draft', () => {
    loadFixture()
    useEditorStore.getState().recalculate([])
    expect(useEditorStore.getState().liveAtsResult?.score).toBeGreaterThan(0)
  })

  it('recalculate() reflects edits: a stronger bullet should not lower the content-quality score', () => {
    loadFixture()
    useEditorStore.getState().recalculate([])
    const before = useEditorStore.getState().liveAtsResult!.breakdown.contentQuality

    useEditorStore.getState().updateExperienceBullet(0, 0, 'Reduced onboarding time by 20% through process automation.')
    useEditorStore.getState().recalculate([])
    const after = useEditorStore.getState().liveAtsResult!.breakdown.contentQuality

    expect(after).toBeGreaterThanOrEqual(before)
  })
})
