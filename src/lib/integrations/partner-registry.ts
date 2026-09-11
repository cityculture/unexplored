import crypto from 'crypto'

export interface PartnerConfig {
  id: 'strangermingle' | 'saltymedia'
  name: string
  secret: string
  hostUserId: string
  hostPageId: string
  defaultCity: string
}

export const PARTNERS: Record<string, PartnerConfig> = {
  strangermingle: {
    id: 'strangermingle',
    name: 'Stranger Mingle',
    secret: process.env.STRANGERMINGLE_SYNC_SECRET || 'sm_cc_sync_sec_8a39f1c7d2e45b6890f1',
    hostUserId: 'bc4a046a-2dfa-480a-9983-7f473c81bf57',
    hostPageId: '40f05b7d-b254-4212-b89d-00ff0af1f14f',
    defaultCity: 'Pune',
  },
  saltymedia: {
    id: 'saltymedia',
    name: 'Salty Media Production',
    secret: process.env.SALTY_SYNC_SECRET || 'salty_cc_sync_sec_9b48f2a1c3d56e790a2b',
    hostUserId: 'ce18f254-8ca0-4cac-bd70-57a0b0d6b0bb',
    hostPageId: '1c8648ab-3b06-4972-a6d4-92f7547a7631',
    defaultCity: 'Pune',
  },
}

/**
 * Verify authentication for incoming partner requests.
 * Supports both:
 * 1. HMAC-SHA256 signature verification (Preferred, highly secure, anti-tamper + anti-replay)
 * 2. Bearer token / x-api-key comparison (Backward compatibility)
 */
export function verifyPartnerAuth(headers: Headers, rawBody: string): { valid: boolean; partner?: PartnerConfig; error?: string } {
  const partnerId = headers.get('x-partner-id')?.toLowerCase()
  const authHeader = headers.get('Authorization')
  const apiKeyHeader = headers.get('x-api-key')
  const signature = headers.get('x-signature')
  const timestampStr = headers.get('x-timestamp')

  // If partnerId specified, resolve partner
  if (partnerId && PARTNERS[partnerId]) {
    const partner = PARTNERS[partnerId]

    // 1. Check HMAC signature if provided
    if (signature && timestampStr) {
      const timestamp = parseInt(timestampStr, 10)
      const now = Date.now()
      // 5-minute replay window (300,000 ms)
      if (isNaN(timestamp) || Math.abs(now - timestamp) > 300000) {
        return { valid: false, error: 'Request timestamp expired or outside replay tolerance window' }
      }

      const expectedSignature = crypto
        .createHmac('sha256', partner.secret)
        .update(`${timestampStr}.${rawBody}`)
        .digest('hex')

      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { valid: true, partner }
      } else {
        return { valid: false, error: 'Invalid HMAC signature' }
      }
    }

    // 2. Fallback to token comparison with specified partner
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKeyHeader
    if (token && token === partner.secret) {
      return { valid: true, partner }
    }
  }

  // 3. Backward compatibility: check if token matches any registered partner secret
  const legacyToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKeyHeader
  if (legacyToken) {
    for (const key of Object.keys(PARTNERS)) {
      if (PARTNERS[key].secret === legacyToken) {
        return { valid: true, partner: PARTNERS[key] }
      }
    }
  }

  return { valid: false, error: 'Unauthorized: Missing or invalid partner credentials' }
}
