import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'
import { register } from '@/features/auth/api'
import { redirectSearchSchema } from '@/features/auth/contracts'
import { completeSignIn } from '@/features/auth/complete-sign-in'

export const Route = createFileRoute('/register')({
  validateSearch: redirectSearchSchema,
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (session) => completeSignIn(queryClient, session, search.redirect ?? '/profile'),
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    registerMutation.mutate({ name, email, password })
  }

  const errorMessage = isApiError(registerMutation.error)
    ? registerMutation.error.message
    : registerMutation.error
      ? 'Não foi possível criar sua conta. Tente novamente.'
      : null

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Comece a colecionar</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta inclui uma carteira simulada para explorar o checkout.
        </p>
      </div>

      <form className="flex flex-col gap-4 rounded-xl border bg-card p-6" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span>
        </label>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          search={{ redirect: search.redirect }}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </section>
  )
}
