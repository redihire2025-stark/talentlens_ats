import { beforeEach, describe, expect, it } from 'vitest'
import { useResumeStore } from './resumeStore'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
  })

  it('starts idle with no file or resume', () => {
    const state = useResumeStore.getState()
    expect(state.file).toBeNull()
    expect(state.resume).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('setFile stores the file and clears any previous result', () => {
    useResumeStore.getState().setFile(makeFile('resume.pdf', 'application/pdf', 1024))
    const state = useResumeStore.getState()
    expect(state.file?.name).toBe('resume.pdf')
    expect(state.resume).toBeNull()
  })

  it('parse() moves to an error state for an unsupported file, without throwing', async () => {
    useResumeStore.getState().setFile(makeFile('resume.txt', 'text/plain', 1024))
    await useResumeStore.getState().parse()
    const state = useResumeStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBeTruthy()
  })

  it('parse() is a no-op when no file has been set', async () => {
    await useResumeStore.getState().parse()
    expect(useResumeStore.getState().status).toBe('idle')
  })

  it('reset() clears everything back to idle', () => {
    useResumeStore.getState().setFile(makeFile('resume.pdf', 'application/pdf', 1024))
    useResumeStore.getState().reset()
    const state = useResumeStore.getState()
    expect(state.file).toBeNull()
    expect(state.status).toBe('idle')
  })
})
