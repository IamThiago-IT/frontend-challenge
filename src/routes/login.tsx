import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'
import { login } from '@/features/auth/api'
import { redirectSearchSchema } from '@/features/auth/contracts'
import { completeSignIn } from '@/features/auth/complete-sign-in'

export const Route = createFileRoute('/login')({
  validateSearch: redirectSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => completeSignIn(queryClient, session, search.redirect),
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.mutate({ email, password })
  }

  const errorMessage = isApiError(loginMutation.error)
    ? loginMutation.error.message
    : loginMutation.error
      ? 'Não foi possível entrar. Tente novamente.'
      : null

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Bem-vindo de volta</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse para finalizar compras, favoritar obras e gerenciar carteiras.
        </p>
      </div>

      <form className="flex flex-col gap-4 rounded-xl border bg-card p-6" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEmail('ana@nft.test')
            setPassword('AnaNft#2026')
          }}
        >
          Usar conta de demonstração
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link
          to="/register"
          search={{ redirect: search.redirect }}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
      <p className="text-xs text-muted-foreground">
        Conta de teste: ana@nft.test · Senha: AnaNft#2026
      </p>
    </section>
  )
}
