import { jwtVerify, createRemoteJWKSet } from 'jose'

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export interface VerifiedFirebaseToken {
  uid: string
  email?: string
  name?: string
  picture?: string
}

export async function verifyFirebaseToken(idToken: string): Promise<VerifiedFirebaseToken> {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'city-culture'

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  })

  if (!payload.sub) {
    throw new Error('Firebase ID Token is missing subject (uid) claim.')
  }

  return {
    uid: payload.sub as string,
    email: (payload.email as string) || undefined,
    name: (payload.name as string) || undefined,
    picture: (payload.picture as string) || undefined,
  }
}
