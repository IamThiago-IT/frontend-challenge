import { HttpResponse, delay, type HttpResponseResolver, type JsonBodyType } from 'msw'
import { type ZodType } from 'zod'

import type { ApiErrorCode } from '@/lib/api/contracts'
import { env } from '@/lib/env'
import { getMockDb, mutateMockDb } from '@/mocks/db'
import type { MockDb, MockSession, MockUser } from '@/mocks/db/schema'
import type { MockFailure } from '@/mocks/scenario'

const guestIdPattern = /^[a-zA-Z0-9-]{8,120}$/
const apiBaseUrl = env.apiBaseUrl.replace(/\/+$/, '')

export function mockApiPath(path: `/${string}`) {
  return `${apiBaseUrl}${path}`
}

export class MockRequestError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fieldErrors?: Record<string, string[]>
  readonly details?: Record<string, unknown>

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options?: {
      fieldErrors?: Record<string, string[]>
      details?: Record<string, unknown>
    },
  ) {
    super(message)

    this.name = 'MockRequestError'
    this.status = status
    this.code = code
    this.fieldErrors = options?.fieldErrors
    this.details = options?.details
  }
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  options?: {
    fieldErrors?: Record<string, string[]>
    details?: Record<string, unknown>
  },
) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        fieldErrors: options?.fieldErrors,
        details: options?.details,
      },
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export function jsonData<T extends JsonBodyType>(data: T, status = 200) {
  return HttpResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

function normalizeFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.') || '_root'
    fieldErrors[field] ??= []
    fieldErrors[field].push(issue.message)
  }

  return fieldErrors
}

export function parseInput<T>(input: unknown, schema: ZodType<T>): T {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    throw new MockRequestError(422, 'VALIDATION_ERROR', 'Dados inválidos.', {
      fieldErrors: normalizeFieldErrors(parsed.error),
      details: {
        issues: parsed.error.issues,
      },
    })
  }

  return parsed.data
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new MockRequestError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }

  return parseInput(body, schema)
}

export async function readOptionalJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const text = await request.text()

  if (!text.trim()) {
    return parseInput({}, schema)
  }

  try {
    return parseInput(JSON.parse(text) as unknown, schema)
  } catch (error) {
    if (error instanceof MockRequestError) {
      throw error
    }

    throw new MockRequestError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }
}

function isBusinessRequest(url: URL) {
  return !url.pathname.includes('/__mocks__/')
}

function failureMatches(pathname: string, failure: MockFailure) {
  return !failure.pathIncludes || pathname.includes(failure.pathIncludes)
}

async function applyInterference(request: Request) {
  const url = new URL(request.url)

  if (!isBusinessRequest(url)) {
    return null
  }

  const state = mutateMockDb((db) => {
    const scenario = db.scenario
    let latency = scenario.latencyMs

    if (scenario.latencyPattern && scenario.latencyPattern.length > 0) {
      latency = scenario.latencyPattern[scenario.latencyCursor % scenario.latencyPattern.length]
      scenario.latencyCursor = (scenario.latencyCursor + 1) % scenario.latencyPattern.length
    }

    let matchedFailure: MockFailure | null = null

    if (
      scenario.failure &&
      scenario.failure.remaining > 0 &&
      failureMatches(url.pathname, scenario.failure)
    ) {
      matchedFailure = { ...scenario.failure }
      scenario.failure.remaining -= 1
    }

    return {
      mode: scenario.mode,
      latency,
      failure: matchedFailure,
    }
  })

  if (state.latency > 0) {
    await delay(state.latency)
  }

  if (state.failure) {
    return jsonError(state.failure.status, state.failure.code, state.failure.message)
  }

  if (state.mode === 'offline') {
    return HttpResponse.error()
  }

  if (state.mode === 'server-error') {
    return jsonError(503, 'TRANSIENT_ERROR', 'A API está temporariamente indisponível.')
  }

  return null
}

export function mockHandler(
  resolver: HttpResponseResolver,
  options?: { controls?: boolean },
): HttpResponseResolver {
  return async (info) => {
    try {
      if (!options?.controls) {
        const interference = await applyInterference(info.request)

        if (interference) {
          return interference
        }
      }

      return await resolver(info)
    } catch (error) {
      if (error instanceof MockRequestError) {
        return jsonError(error.status, error.code, error.message, {
          fieldErrors: error.fieldErrors,
          details: error.details,
        })
      }

      console.error(error)

      return jsonError(500, 'UNKNOWN_ERROR', 'Erro interno na API simulada.')
    }
  }
}

export function getRequestSessionToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length)
}

const getBearerToken = getRequestSessionToken

function isSessionExpired(session: MockSession) {
  return Date.parse(session.expiresAt) <= Date.now()
}

export function getUserBySessionToken(token: string | null) {
  if (!token) {
    return null
  }

  const db = getMockDb()
  const session = db.sessions.find((item) => item.token === token)

  if (!session || isSessionExpired(session)) {
    return null
  }

  return db.users.find((user) => user.id === session.userId) ?? null
}

export type MockAuthenticatedActor = {
  type: 'user'
  token: string
  session: MockSession
  user: MockUser
}

export type MockGuestActor = {
  type: 'guest'
  guestId: string
}

export type MockActor = MockAuthenticatedActor | MockGuestActor

export function requireAuthenticatedActor(request: Request): MockAuthenticatedActor {
  const token = getBearerToken(request)

  if (!token) {
    throw new MockRequestError(401, 'UNAUTHORIZED', 'Autenticação obrigatória.')
  }

  const db = getMockDb()
  const session = db.sessions.find((item) => item.token === token)

  if (!session) {
    throw new MockRequestError(401, 'SESSION_EXPIRED', 'Sessão inválida ou expirada.')
  }

  if (isSessionExpired(session)) {
    mutateMockDb((draft) => {
      draft.sessions = draft.sessions.filter((item) => item.token !== token)
    })
    throw new MockRequestError(401, 'SESSION_EXPIRED', 'Sessão expirada.')
  }

  const user = db.users.find((item) => item.id === session.userId)

  if (!user) {
    throw new MockRequestError(401, 'UNAUTHORIZED', 'Usuário da sessão não encontrado.')
  }

  return {
    type: 'user',
    token,
    session,
    user,
  }
}

export function getOptionalAuthenticatedActor(request: Request) {
  const token = getBearerToken(request)

  return token ? requireAuthenticatedActor(request) : null
}

export function requireActor(request: Request, options?: { allowGuest?: boolean }): MockActor {
  const authenticatedActor = getOptionalAuthenticatedActor(request)

  if (authenticatedActor) {
    return authenticatedActor
  }

  if (!options?.allowGuest) {
    throw new MockRequestError(401, 'UNAUTHORIZED', 'Autenticação obrigatória.')
  }

  return {
    type: 'guest',
    guestId: requireGuestId(request),
  }
}

export function requireGuestId(request: Request) {
  const guestId = request.headers.get('X-Guest-Id')

  if (!guestId || !guestIdPattern.test(guestId)) {
    throw new MockRequestError(
      400,
      'GUEST_ID_REQUIRED',
      'Identificador de visitante ausente ou inválido.',
    )
  }

  return guestId
}

export function getActorCartKey(actor: MockActor) {
  return actor.type === 'user' ? `user:${actor.user.id}` : `guest:${actor.guestId}`
}

export function getDbUser(db: MockDb, userId: string) {
  return db.users.find((user) => user.id === userId) ?? null
}
