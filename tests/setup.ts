import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// React Testing Library normally auto-registers this via a global
// `afterEach`, but this project doesn't enable Vitest's `test.globals`
// (tests import `describe`/`it`/etc. explicitly instead), so that
// detection silently no-ops and components stay mounted between tests
// within the same file — harmless for single-render test files, but it
// lets state leak between tests that each render the full App.
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement window.scrollTo (App.tsx calls it on every
// navigation) and logs a noisy "Not implemented" error for it otherwise.
window.scrollTo = () => {}

// jsdom's Blob/File implementation doesn't provide `arrayBuffer()` (only
// `text()`), unlike every real browser. Our parsers call `file.arrayBuffer()`
// directly — real, correct browser code — so this is a test-environment gap
// to patch, not something production code should work around.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
