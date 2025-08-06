import { Elysia } from 'elysia'
import * as jose from 'jose'

interface StackAuthEnv {
  NEXT_PUBLIC_STACK_PROJECT_ID?: string
  STACK_SECRET_SERVER_KEY?: string
}

/**
 * Authentication & authorization plugin.
 *
 * 1. Accepts either:
 *    - Bearer token via `Authorization` header (Stack user API key)
 *    - JWT via `X-Access-Token` header (Stack session token)
 * 2. Validates the credential against Stack Auth backend or JWKS.
 * 3. Returns 401 for any invalid or missing credential.
 *
 * Designed to be mounted under a specific prefix, e.g.
 *     app.group('/api', (api) => api.use(authenticateUser()))
 */
export function authenticateUser() {
  return new Elysia({ name: 'authenticate-user' }).onBeforeHandle(
    async ({ headers, set }) => {
      const {
        NEXT_PUBLIC_STACK_PROJECT_ID: projectId,
        STACK_SECRET_SERVER_KEY: secretServerKey,
      } = process.env as unknown as StackAuthEnv

      const authHeader = headers['authorization']
      const accessToken = headers['x-access-token']

      const unauthorizedBody = 'Unauthorized'

      if (!authHeader && !accessToken) {
        set.status = 401
        return unauthorizedBody
      }

      // Validate API key via Stack Auth REST endpoint
      if (authHeader) {
        const response = await fetch(
          'https://api.stack-auth.com/api/v1/user-api-keys/check',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-stack-access-type': 'server',
              'x-stack-project-id': projectId ?? '',
              'x-stack-secret-server-key': secretServerKey ?? '',
            },
            body: JSON.stringify({ api_key: authHeader.replace('Bearer ', '') }),
          }
        )

        if (response.status !== 200) {
          set.status = 401
          return unauthorizedBody
        }
      }

      // Validate JWT using remote JWKS
      if (accessToken) {
        const jwks = jose.createRemoteJWKSet(
          new URL(
            `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`
          )
        )

        try {
          await jose.jwtVerify(accessToken, jwks)
        } catch {
          set.status = 401
          return unauthorizedBody
        }
      }
    }
  )
}
