# Contribuição

## Branches

| Branch              | Papel                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| `main`              | Código publicado/demonstração. Recebe apenas PRs de `develop` ou `hotfix/*`. |
| `develop`           | Integração contínua das funcionalidades.                                     |
| `feat/<escopo>`     | Nova funcionalidade.                                                         |
| `fix/<escopo>`      | Correção de bug.                                                             |
| `chore/<escopo>`    | Build, dependências, configuração.                                           |
| `docs/<escopo>`     | Documentação.                                                                |
| `refactor/<escopo>` | Refatoração sem mudança de comportamento.                                    |
| `test/<escopo>`     | Testes.                                                                      |
| `hotfix/<escopo>`   | Correção urgente criada a partir de `main`.                                  |

Fluxo padrão:

```bash
git switch develop
git pull --rebase
git switch -c feat/catalogo-filtros
# ... commits ...
git push -u origin feat/catalogo-filtros
```

Abra o PR para `develop`. `main` é atualizada a partir de `develop` ao final de um ciclo
ou por `hotfix/*` quando houver urgência.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<tipo>(<escopo opcional>): <descrição no imperativo>
```

Exemplos:

```text
feat(cart): aplicar cupom e exibir desconto
fix(auth): preservar retorno após expiração de sessão
chore(deps): atualizar tanstack query
test(e2e): cobrir compra com preço alterado
```

Tipos aceitos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`,
`revert`.

O `commit-msg` roda o commitlint e o `pre-commit` executa ESLint + Prettier nos arquivos
staged via lint-staged.

## Antes de abrir o PR

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm e2e
```

## Configuração local do Git

O repositório usa:

- `pull.rebase=true` para histórico linear;
- `fetch.prune=true`;
- `push.autoSetupRemote=true`;
- `merge.conflictstyle=zdiff3`;
- `core.autocrlf=false` com normalização por `.gitattributes`.

## Proteção de branches

Recomendado no GitHub (`Settings > Rules`):

- `main`: exigir PR, aprovação, status checks do CI e bloquear force push;
- `develop`: exigir PR e status checks do CI;
- permitir merge apenas com histórico linear (rebase ou squash).
