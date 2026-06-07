# Wordless

A Wordle-style word puzzle. Guess the hidden 5-letter word in 6 tries.

## Features

- Six daily puzzles (3, 4, 5, 6, 7, and 8 letters)
- Words fetched from online APIs (Datamuse + Random Word API)
- Guesses validated via Free Dictionary API

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun start` | Run production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | TypeScript check |

## CI/CD & GitOps

```
PR → lint + typecheck + build
main → Docker build → push aeonamind/lessgames:<sha> → update gitops repo → Argo CD sync
```

### GitHub secrets required

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | DockerHub login |
| `DOCKER_PASSWORD` | DockerHub token |
| `GITOPS_TOKEN` | PAT to push image tag updates to `aeonamind/gitops` |

### GitOps (Argo CD)

Helm chart lives in the [gitops](https://github.com/aeonamind/gitops) repo:

- `infra/lessgames/` — Deployment, Service, Ingress
- `apps/lessgames/application.yaml` — Argo CD Application (picked up by root app)

Ingress host defaults to `lessgames.eugenebox.uk` — edit `infra/lessgames/values.yaml` to change.

### Local Docker

```bash
docker build -t lessgames:local .
docker run --rm -p 3000:3000 lessgames:local
```

## Project structure

```
src/
  app/                    Next.js routes (one folder per game)
    page.tsx              Game hub
    wordless/
    clueless/
    songless/
  games/
    registry.ts           Central game catalog
    wordless/             Wordless game module
      components/
      lib/
      data/
    clueless/             Placeholder for future game
    songless/
  shared/                 Cross-game utilities
    config/               Site-wide settings (timezone, etc.)
    lib/                  Daily shuffle, storage helpers
    components/           Shared UI (countdown, shell, etc.)
```

## Adding a new game

1. Create `src/games/<slug>/` with `config.ts`, components, and lib.
2. Register it in `src/games/registry.ts`.
3. Add a route at `src/app/<slug>/page.tsx`.

All games share the daily shuffle schedule via `src/shared/lib/daily.ts`.

## Daily shuffle

The game day rolls over at 03:00 GMT+7 (not midnight UTC). Each game uses a unique salt so daily picks differ across games on the same day.
