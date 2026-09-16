import { describe, expect, it } from 'vitest'

/**
 * extractText.ts wraps pdfjs-dist and mammoth (see the module's own
 * comment for why binary-fixture tests aren't worth it here). This test
 * exists only to catch module-resolution mistakes — the Vite `?url` worker
 * import, the mammoth browser build — that a pure type-check wouldn't.
 */
describe('extractText module resolution', () => {
  it('imports without throwing and wires up the pdf.js worker URL', async () => {
    await import('./extractText')
    const pdfjsLib = await import('pdfjs-dist')
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBeTruthy()
  })
})
