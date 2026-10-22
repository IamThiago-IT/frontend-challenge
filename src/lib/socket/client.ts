import { io, type Socket } from 'socket.io-client'

import { env } from '@/lib/env'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket/events'

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: RealtimeSocket | null = null

export function getSocket() {
  socket ??= io(env.socketUrl, {
    autoConnect: false,
    path: env.enableMocks ? '/mock-socket.io' : '/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
  })

  return socket
}

export function connectSocket() {
  getSocket().connect()
}

export function disconnectSocket() {
  socket?.disconnect()
  socket?.removeAllListeners()
  socket = null
}
