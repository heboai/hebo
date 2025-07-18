import {MiddlewareHandler} from 'hono'
import {env} from 'hono/adapter'
import {HTTPException} from 'hono/http-exception'
import * as jose from 'jose'

type StackAuthEnv = {
  NEXT_PUBLIC_STACK_PROJECT_ID: string
  STACK_SECRET_SERVER_KEY: string
}

export function authenticateUser(): MiddlewareHandler {
  return async (c, next) => {
    const {NEXT_PUBLIC_STACK_PROJECT_ID: projectId, STACK_SECRET_SERVER_KEY: secretServerKey} = env(c) as StackAuthEnv
    const {'Authorization': authHeader, 'X-Access-Token': accessToken} = c.req.header()
    const unauthorizedResponse = new Response('Unauthorized', {status: 401})

    if (authHeader == null && accessToken == null) {
      throw new HTTPException(401, {res: unauthorizedResponse})
    }

    if (authHeader != null) {
      const url = 'https://api.stack-auth.com/api/v1/user-api-keys/check';
      const data = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-stack-access-type': 'server',
          'x-stack-project-id': projectId,
          'x-stack-secret-server-key': secretServerKey,
        },
        body: JSON.stringify({api_key: authHeader.replace('Bearer ', '')}),
      };

      const response = await fetch(url, data);
      if (response.status !== 200) {
        throw new HTTPException(401, {res: unauthorizedResponse})
      }
    }

    if (accessToken != null) {
      const jwks = jose.createRemoteJWKSet(new URL('https://api.stack-auth.com/api/v1/projects/' + projectId + '/.well-known/jwks.json'));
      try {
        await jose.jwtVerify(accessToken, jwks)
      } catch {
        throw new HTTPException(401, {res: unauthorizedResponse})
      }
    }

    await next()
  }
}

