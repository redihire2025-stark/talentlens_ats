import type { ApiResult, HealthResponse } from './types'

/** GET /api/health */
export async function getHealth(): Promise<ApiResult<HealthResponse>> {
  return { ok: true, data: { status: 'ok' } }
}
