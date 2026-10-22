import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ChangeEvent, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { getApiFieldError, isApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import type { SessionResponse, UserProfile } from '@/features/auth/contracts'
import { changePassword, updateAvatar, updateProfile } from '@/features/profile/api'
import { profileQueryOptions } from '@/features/profile/queries'
import type { UpdateProfileRequest } from '@/features/profile/contracts'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function updateCachedProfile(queryClient: QueryClient, profile: UserProfile) {
  queryClient.setQueryData(queryKeys.private.profile(profile.id), profile)
  queryClient.setQueryData<SessionResponse | null>(queryKeys.auth.session, (current) =>
    current && current.user.id === profile.id ? { ...current, user: profile } : current,
  )
}

function ProfilePage() {
  const { session } = Route.useRouteContext()
  const {
    data: profile,
    isPending,
    isError,
    refetch,
  } = useQuery(profileQueryOptions(session.user.id))

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Sua conta</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualize seus dados, avatar e senha. As alterações ficam salvas nesta simulação.
        </p>
      </div>

      {isPending ? (
        <div className="h-96 animate-pulse rounded-xl border bg-muted" />
      ) : isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar seu perfil.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : profile ? (
        <ProfileEditor profile={profile} />
      ) : null}
    </section>
  )
}

function ProfileEditor({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [avatarFileError, setAvatarFileError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileMutation = useMutation({
    mutationFn: (input: UpdateProfileRequest) => updateProfile(input),
    onSuccess: (updated) => {
      setName(updated.name)
      setUsername(updated.username)
      setEmail(updated.email)
      setBio(updated.bio ?? '')
      updateCachedProfile(queryClient, updated)
    },
  })
  const avatarMutation = useMutation({
    mutationFn: () => updateAvatar({ avatarUrl }),
    onSuccess: (updated) => {
      setAvatarUrl(updated.avatarUrl ?? '')
      updateCachedProfile(queryClient, updated)
    },
  })
  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
  })

  const profileError = profileMutation.error
  const nameError = getApiFieldError(profileError, 'name')
  const usernameError = getApiFieldError(profileError, 'username')
  const emailError = getApiFieldError(profileError, 'email')
  const bioError = getApiFieldError(profileError, 'bio')
  const passwordCurrentError = getApiFieldError(passwordMutation.error, 'currentPassword')
  const passwordNewError = getApiFieldError(passwordMutation.error, 'newPassword')

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    profileMutation.mutate({
      name,
      username,
      email,
      bio: bio.trim() || null,
    })
  }

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação precisa ser igual à nova senha.')
      return
    }

    setPasswordError(null)
    passwordMutation.mutate()
  }

  const handleAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > 300_000) {
      setAvatarFileError('Escolha uma imagem de até 300 KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarFileError(null)
      setAvatarUrl(String(reader.result))
    }
    reader.onerror = () => setAvatarFileError('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 rounded-xl border bg-card p-6"
        data-testid="profile-form"
        onSubmit={submitProfile}
      >
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Avatar de ${profile.name}`}
              className="size-16 rounded-full border object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border bg-muted text-xl font-semibold">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">Dados pessoais</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Nome</span>
            <input
              data-testid="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'profile-name-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="profile-name-error" message={nameError} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Nome de usuário</span>
            <input
              data-testid="profile-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={32}
              autoComplete="username"
              aria-invalid={Boolean(usernameError)}
              aria-describedby={usernameError ? 'profile-username-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="profile-username-error" message={usernameError} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium">E-mail</span>
            <input
              data-testid="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'profile-email-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="profile-email-error" message={emailError} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Bio</span>
            <textarea
              data-testid="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={240}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-invalid={Boolean(bioError)}
              aria-describedby={bioError ? 'profile-bio-error' : undefined}
            />
            <span className="text-xs text-muted-foreground">{bio.length}/240</span>
            <FieldError id="profile-bio-error" message={bioError} />
          </label>
        </div>

        {profileError ? (
          <p className="text-sm text-destructive" role="alert">
            {isApiError(profileError) ? profileError.message : 'Não foi possível salvar o perfil.'}
          </p>
        ) : null}
        {profileMutation.isSuccess ? (
          <p className="text-sm text-emerald-600" role="status" data-testid="profile-feedback">
            Perfil atualizado.
          </p>
        ) : null}

        <Button
          type="submit"
          data-testid="profile-save"
          disabled={profileMutation.isPending}
          className="self-start"
        >
          {profileMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <form
        className="flex flex-col gap-4 rounded-xl border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault()
          avatarMutation.mutate()
        }}
      >
        <div>
          <h2 className="text-lg font-semibold">Avatar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe uma URL ou envie uma imagem pequena para atualizar seu avatar.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">URL do avatar</span>
          <input
            data-testid="avatar-url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            required
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Ou escolha uma imagem</span>
          <input
            type="file"
            accept="image/*"
            data-testid="avatar-file"
            onChange={handleAvatarFile}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </label>
        {avatarFileError ? (
          <p className="text-sm text-destructive" role="alert">
            {avatarFileError}
          </p>
        ) : null}
        {avatarMutation.error ? (
          <p className="text-sm text-destructive" role="alert">
            {isApiError(avatarMutation.error)
              ? avatarMutation.error.message
              : 'Não foi possível atualizar o avatar.'}
          </p>
        ) : null}
        {avatarMutation.isSuccess ? (
          <p className="text-sm text-emerald-600" role="status">
            Avatar atualizado.
          </p>
        ) : null}
        <Button
          type="submit"
          data-testid="avatar-save"
          variant="outline"
          disabled={avatarMutation.isPending}
          className="self-start"
        >
          {avatarMutation.isPending ? 'Atualizando...' : 'Salvar avatar'}
        </Button>
      </form>

      <form className="flex flex-col gap-4 rounded-xl border bg-card p-6" onSubmit={submitPassword}>
        <div>
          <h2 className="text-lg font-semibold">Alterar senha</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A nova senha precisa ter ao menos 8 caracteres.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Senha atual</span>
            <input
              data-testid="password-current"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoComplete="current-password"
              aria-invalid={Boolean(passwordCurrentError)}
              aria-describedby={passwordCurrentError ? 'password-current-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="password-current-error" message={passwordCurrentError} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Nova senha</span>
            <input
              data-testid="password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordNewError)}
              aria-describedby={passwordNewError ? 'password-new-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="password-new-error" message={passwordNewError} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Confirmar nova senha</span>
            <input
              data-testid="password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-confirm-error' : undefined}
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldError id="password-confirm-error" message={passwordError} />
          </label>
        </div>
        {passwordMutation.error ? (
          <p className="text-sm text-destructive" role="alert">
            {isApiError(passwordMutation.error)
              ? passwordMutation.error.message
              : 'Não foi possível alterar a senha.'}
          </p>
        ) : null}
        {passwordMutation.isSuccess ? (
          <p className="text-sm text-emerald-600" role="status">
            Senha alterada.
          </p>
        ) : null}
        <Button
          type="submit"
          data-testid="password-save"
          variant="outline"
          disabled={passwordMutation.isPending}
          className="self-start"
        >
          {passwordMutation.isPending ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </form>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}
