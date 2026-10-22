import { z } from 'zod'

import { apiErrorCodeSchema } from '@/lib/api/contracts'

export const mockScenarioModeSchema = z.enum(['default', 'empty', 'offline', 'server-error'])

export const mockFailureSchema = z.object({
  status: z.number().int().min(400).max(599).default(503),
  code: apiErrorCodeSchema.default('TRANSIENT_ERROR'),
  message: z.string().min(1).default('Falha simulada pela API.'),
  pathIncludes: z.string().min(1).optional(),
  remaining: z.number().int().nonnegative().default(1),
})

export const mockScenarioSchema = z.object({
  mode: mockScenarioModeSchema,
  latencyMs: z.number().int().nonnegative(),
  latencyPattern: z.array(z.number().int().nonnegative()).nullable(),
  latencyCursor: z.number().int().nonnegative(),
  failure: mockFailureSchema.nullable(),
  sessionTtlMs: z.number().int().nonnegative(),
  paymentResult: z.enum(['confirmed', 'declined']),
  paymentDelayMs: z.number().int().nonnegative(),
  timeoutAfterOrderCreate: z.boolean(),
  orderTimeoutDelayMs: z.number().int().nonnegative(),
  emitDuplicates: z.boolean(),
  staleEventOffset: z.number().int().nonnegative(),
})

export const mockScenarioPatchSchema = mockScenarioSchema
  .omit({
    latencyCursor: true,
  })
  .partial()

export type MockScenarioMode = z.infer<typeof mockScenarioModeSchema>
export type MockFailure = z.infer<typeof mockFailureSchema>
export type MockScenario = z.infer<typeof mockScenarioSchema>
export type MockScenarioPatch = z.infer<typeof mockScenarioPatchSchema>

export function createDefaultScenario(): MockScenario {
  return {
    mode: 'default',
    latencyMs: 0,
    latencyPattern: null,
    latencyCursor: 0,
    failure: null,
    sessionTtlMs: 60 * 60_000,
    paymentResult: 'confirmed',
    paymentDelayMs: 700,
    timeoutAfterOrderCreate: false,
    orderTimeoutDelayMs: 20_000,
    emitDuplicates: false,
    staleEventOffset: 0,
  }
}
