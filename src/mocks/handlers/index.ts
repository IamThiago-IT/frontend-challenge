import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { catalogHandlers } from '@/mocks/handlers/catalog'
import { checkoutHandlers } from '@/mocks/handlers/checkout'
import { controlsHandlers } from '@/mocks/handlers/controls'
import { favoritesHandlers } from '@/mocks/handlers/favorites'
import { ordersHandlers } from '@/mocks/handlers/orders'
import { profileHandlers } from '@/mocks/handlers/profile'
import { walletsHandlers } from '@/mocks/handlers/wallets'
import { socketHandlers } from '@/mocks/ws/server'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...ordersHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...controlsHandlers,
  ...socketHandlers,
]
