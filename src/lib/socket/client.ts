import { io, type Socket } from 'socket.io-client'

import { env } from '@/lib/env'

let socket: Socket | null = null

export function getSocket() {
  socket ??= io(env.socketUrl, {
    autoConnect: false,
    transports: ['websocket'],
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket?.removeAllListeners()
  socket = null
}
