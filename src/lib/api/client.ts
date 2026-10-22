import axios from 'axios'

import { env } from '@/lib/env'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
})
