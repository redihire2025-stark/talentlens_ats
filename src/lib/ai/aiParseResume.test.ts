import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PARSE_RESUME_FUNCTION_ENDPOINT, requestAiResumeParse } from './aiParseResume'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestAiResumeParse', () => {
  it('POSTs only the text to the Netlify Function endpoint, never to OpenAI and never with a key', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, data: { name: 'Jane' } }), { status: 200 }))
    const result = await requestAiResumeParse({ text: 'Jane Doe' })

    expect(result.ok).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(PARSE_RESUME_FUNCTION_ENDPOINT)
    expect(url).not.toContain('openai.com')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ text: 'Jane Doe' })
  })

  it('passes through a server-side failure (e.g. no key configured) as ok:false', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: 'No AI provider configured on the server.' }), { status: 200 }))
    expect(await requestAiResumeParse({ text: 'x' })).toEqual({ ok: false, error: 'No AI provider configured on the server.' })
  })

  it('returns ok:false on a non-2xx response, a network error, or a malformed body — never throws', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))
    expect((await requestAiResumeParse({ text: 'x' })).ok).toBe(false)

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect((await requestAiResumeParse({ text: 'x' })).ok).toBe(false)

    fetchMock.mockResolvedValueOnce(new Response('"just a string"', { status: 200 }))
    expect((await requestAiResumeParse({ text: 'x' })).ok).toBe(false)
  })

  it('gives up after the timeout', async () => {
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    const result = await requestAiResumeParse({ text: 'x' }, 10)
    expect(result.ok).toBe(false)
  })
})
