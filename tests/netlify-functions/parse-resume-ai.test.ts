import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handler } from '../../netlify/functions/parse-resume-ai'

/**
 * Lives outside netlify/functions/ on purpose: Netlify's function bundler
 * scans every file directly in that directory as a candidate function, and
 * a co-located `*.test.ts` file there broke the deploy (the dot in the
 * filename isn't a valid function-name character — see the Netlify build
 * error this fixed). Any future test for a function under netlify/functions/
 * should go in this directory too, not next to the function itself.
 *
 * The network boundary (OpenAI) is mocked with a stubbed global `fetch` —
 * no real call is ever made. Covers the same contract rewrite-bullet.ts
 * has: key read server-side only, JSON-mode request, retry on 429/503,
 * uniform `{ ok, error }` failure shape.
 */

function openAiOk(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
}

function post(body: unknown) {
  return { httpMethod: 'POST', body: JSON.stringify(body) }
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('parse-resume-ai function', () => {
  it('rejects non-POST requests', async () => {
    const res = await handler({ httpMethod: 'GET', body: null })
    expect(res.statusCode).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a silent-fallback error (and makes no OpenAI call) when no key is configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const res = await handler(post({ text: 'Jane Doe' }))
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'No AI provider configured on the server.' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates the request body', async () => {
    expect((await handler(post({}))).statusCode).toBe(400)
    expect((await handler(post({ text: '   ' }))).statusCode).toBe(400)
    expect((await handler({ httpMethod: 'POST', body: '{not json' })).statusCode).toBe(400)
    expect((await handler(post({ text: 'x'.repeat(50_001) }))).statusCode).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the key only in the server-side Authorization header and requests JSON mode', async () => {
    fetchMock.mockResolvedValueOnce(openAiOk(JSON.stringify({ name: 'Jane Doe', skills: ['Go'] })))
    const res = await handler(post({ text: 'Jane Doe\nSkills: Go' }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer sk-test-key')
    const body = JSON.parse(init.body)
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.temperature).toBe(0)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].content).toContain('Jane Doe\nSkills: Go')

    const result = JSON.parse(res.body)
    expect(result.ok).toBe(true)
    expect(result.data.name).toBe('Jane Doe')
    expect(result.data.skills).toEqual(['Go'])
    // Shape-coerced: every key present even when the model omitted it.
    expect(result.data.experience).toEqual([])
    expect(result.data.email).toBeNull()
  })

  it('reports invalid JSON from the model as a failure', async () => {
    fetchMock.mockResolvedValueOnce(openAiOk('not json at all'))
    const result = JSON.parse((await handler(post({ text: 'Jane' }))).body)
    expect(result).toEqual({ ok: false, error: 'OpenAI returned a response that was not valid JSON.' })
  })

  it('does not retry a rejected key', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
    const result = JSON.parse((await handler(post({ text: 'Jane' }))).body)
    expect(result.ok).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on 429/503, then succeeds', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(openAiOk('{"name":"Jane"}'))
    const pending = handler(post({ text: 'Jane' }))
    await vi.runAllTimersAsync()
    const result = JSON.parse((await pending).body)
    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns a network failure without throwing', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'))
    const result = JSON.parse((await handler(post({ text: 'Jane' }))).body)
    expect(result.ok).toBe(false)
  })
})
