import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type { RealtimeEvent } from '@/lib/socket/events'
import { getUserBySessionToken } from '@/mocks/http'
import { getMockScenario } from '@/mocks/db'
import { setMockRealtimeEmitter } from '@/mocks/ws/emitter'

type MockSocketConnection = {
  io: ReturnType<typeof toSocketIo>
  userId: string | null
}

const connections = new Set<MockSocketConnection>()

function staleEvent(event: RealtimeEvent, offset: number): RealtimeEvent {
  if (offset <= 0) {
    return event
  }

  return {
    ...event,
    occurredAt: new Date(Date.parse(event.occurredAt) - offset).toISOString(),
  }
}

function sendEvent(connection: MockSocketConnection, event: RealtimeEvent) {
  const scenario = getMockScenario()

  if (event.type === 'order.updated' && connection.userId !== event.userId) {
    return
  }

  const payload = staleEvent(event, scenario.staleEventOffset)
  connection.io.client.emit(payload.type, payload)

  if (scenario.emitDuplicates) {
    connection.io.client.emit(payload.type, payload)
  }
}

function broadcast(event: RealtimeEvent) {
  connections.forEach((connection) => sendEvent(connection, event))
}

setMockRealtimeEmitter(broadcast)

export const socketMock = ws.link(/\/mock-socket\.io\//)

export const socketHandlers = [
  socketMock.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const state: MockSocketConnection = {
      io,
      userId: null,
    }

    connections.add(state)

    io.client.on('session:hello', (_event, payload: { token?: string | null }) => {
      const token = payload?.token ?? null
      const user = getUserBySessionToken(token)
      state.userId = user?.id ?? null
    })

    connection.client.addEventListener('close', () => {
      connections.delete(state)
    })
  }),
]

export function getMockSocketCount() {
  return connections.size
}

export function disconnectMockSockets(userId?: string) {
  const disconnected: MockSocketConnection[] = []

  connections.forEach((connection) => {
    if (!userId || connection.userId === userId) {
      disconnected.push(connection)
    }
  })

  disconnected.forEach((connection) => {
    connection.io.rawClient.close()
    connections.delete(connection)
  })

  return disconnected.length
}
