import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { getApiFieldError, isApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import { createWallet, updateWallet } from '@/features/wallets/api'
import { walletsQueryOptions } from '@/features/wallets/queries'
import type { CreateWalletRequest, UpdateWalletRequest, Wallet } from '@/features/wallets/contracts'

const networkOptions = ['ethereum', 'polygon', 'base'] as const
const networkLabels: Record<Wallet['network'], string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
}

type WalletFormValues = {
  label: string
  address: string
  network: Wallet['network']
  isPrimary: boolean
}

export const Route = createFileRoute('/_authenticated/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  const { session } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useQuery(walletsQueryOptions(session.user.id))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const walletsKey = queryKeys.private.wallets(session.user.id)
  const setWallets = (updater: (items: Wallet[]) => Wallet[]) => {
    queryClient.setQueryData(walletsKey, (current: typeof data) =>
      current ? { ...current, items: updater(current.items) } : current,
    )
  }
  const createMutation = useMutation({
    mutationFn: (input: CreateWalletRequest) => createWallet(input),
    onSuccess: (wallet) => {
      setWallets((items) => [
        ...items.map((item) => (wallet.isPrimary ? { ...item, isPrimary: false } : item)),
        wallet,
      ])
      setCreateKey((current) => current + 1)
      setFeedback('Carteira adicionada.')
      void queryClient.invalidateQueries({ queryKey: walletsKey })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: UpdateWalletRequest }) =>
      updateWallet(walletId, input),
    onSuccess: (wallet) => {
      setWallets((items) =>
        items.map((item) => {
          if (item.id === wallet.id) {
            return wallet
          }

          return wallet.isPrimary ? { ...item, isPrimary: false } : item
        }),
      )
      setEditingId(null)
      setFeedback('Carteira atualizada.')
      void queryClient.invalidateQueries({ queryKey: walletsKey })
    },
  })

  const wallets = data?.items ?? []
  const editingWallet = editingId ? wallets.find((wallet) => wallet.id === editingId) : undefined
  const atLimit = Boolean(data && wallets.length >= data.maxWallets)

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Checkout</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Carteiras</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre e edite as carteiras simuladas usadas para receber os NFTs comprados.
        </p>
      </div>

      {feedback ? (
        <p className="text-sm text-emerald-600" role="status">
          {feedback}
        </p>
      ) : null}
      {updateMutation.error && !editingWallet ? (
        <p className="text-sm text-destructive" role="alert">
          {isApiError(updateMutation.error)
            ? updateMutation.error.message
            : 'Não foi possível atualizar a carteira.'}
        </p>
      ) : null}

      {isPending ? (
        <div className="h-64 animate-pulse rounded-xl border bg-muted" />
      ) : isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar suas carteiras.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col gap-3">
            {wallets.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Nenhuma carteira cadastrada.
              </p>
            ) : (
              wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  data-testid={`wallet-row-${wallet.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {wallet.label}
                      {wallet.isPrimary ? (
                        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                          Principal
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                      {networkLabels[wallet.network]} · {wallet.address}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!wallet.isPrimary ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`wallet-primary-${wallet.id}`}
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            walletId: wallet.id,
                            input: { isPrimary: true },
                          })
                        }
                      >
                        Definir como principal
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      data-testid={`wallet-edit-${wallet.id}`}
                      onClick={() => {
                        updateMutation.reset()
                        setEditingId(wallet.id)
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              {wallets.length} de {data.maxWallets} carteiras cadastradas.
            </p>
          </div>

          {editingWallet ? (
            <WalletForm
              key={editingWallet.id}
              mode="edit"
              wallet={editingWallet}
              pending={updateMutation.isPending}
              error={updateMutation.error}
              onCancel={() => setEditingId(null)}
              onSubmit={(values) =>
                updateMutation.mutate({
                  walletId: editingWallet.id,
                  input: values,
                })
              }
            />
          ) : atLimit ? (
            <p className="rounded-xl border p-4 text-sm text-muted-foreground">
              Você atingiu o limite de {data.maxWallets} carteiras.
            </p>
          ) : (
            <WalletForm
              key={`create-${createKey}`}
              mode="create"
              pending={createMutation.isPending}
              error={createMutation.error}
              onSubmit={(values) => createMutation.mutate(values)}
            />
          )}
        </>
      ) : null}
    </section>
  )
}

type WalletFormProps = {
  mode: 'create' | 'edit'
  wallet?: Wallet
  pending: boolean
  error: unknown
  onSubmit: (values: WalletFormValues) => void
  onCancel?: () => void
}

function WalletForm({ mode, wallet, pending, error, onSubmit, onCancel }: WalletFormProps) {
  const [label, setLabel] = useState(wallet?.label ?? '')
  const [address, setAddress] = useState(wallet?.address ?? '')
  const [network, setNetwork] = useState<Wallet['network']>(wallet?.network ?? 'ethereum')
  const [isPrimary, setIsPrimary] = useState(wallet?.isPrimary ?? false)
  const labelError = getApiFieldError(error, 'label')
  const addressError = getApiFieldError(error, 'address')
  const networkError = getApiFieldError(error, 'network')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ label, address, network, isPrimary })
  }

  return (
    <form
      data-testid={mode === 'create' ? 'wallet-create-form' : 'wallet-edit-form'}
      className="flex flex-col gap-4 rounded-xl border bg-card p-6"
      onSubmit={submit}
    >
      <div>
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Adicionar carteira' : 'Editar carteira'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use um endereço EVM fictício com 40 caracteres hexadecimais.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Apelido</span>
          <input
            data-testid="wallet-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            required
            maxLength={40}
            aria-invalid={Boolean(labelError)}
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <FieldError message={labelError} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Rede</span>
          <select
            data-testid="wallet-network"
            value={network}
            onChange={(event) => setNetwork(event.target.value as Wallet['network'])}
            aria-invalid={Boolean(networkError)}
            className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {networkOptions.map((option) => (
              <option key={option} value={option}>
                {networkLabels[option]}
              </option>
            ))}
          </select>
          <FieldError message={networkError} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Endereço</span>
          <input
            data-testid="wallet-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            pattern="0x[a-fA-F0-9]{40}"
            title="Informe um endereço EVM iniciado por 0x e com 40 caracteres hexadecimais."
            spellCheck={false}
            aria-invalid={Boolean(addressError)}
            className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <FieldError message={addressError} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            data-testid="wallet-primary"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
            className="size-4 rounded border-input"
          />
          <span>Definir como carteira principal</span>
        </label>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {isApiError(error) ? error.message : 'Não foi possível salvar a carteira.'}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" data-testid="wallet-submit" disabled={pending}>
          {pending ? 'Salvando...' : mode === 'create' ? 'Adicionar carteira' : 'Salvar alterações'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function FieldError({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}
