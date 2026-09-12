# sity

A coastal city built in Three.js as the ground for smart-traffic simulation. Every road in the scene is
already a directed lane graph — lanes, turns, ramps, roundabouts — so vehicles and traffic devices can be
added on top without a second model of the streets.

## Repository shape

One workspace, `apps/web`: a Vite + TypeScript site with no backend and no secrets. The whole scene is
generated at load time from deterministic plans, and a debug API on `window.__SITY_DEBUG__` exposes the
lane graph, routing, statistics and camera presets for the end-to-end checks.

| Concern      | Where                                                        |
| ------------ | ------------------------------------------------------------ |
| Road plan    | `apps/web/src/roads/plan.ts` — nodes and typed roads         |
| Lane graph   | `apps/web/src/roads/network.ts` and `graph.ts`               |
| Road drawing | `apps/web/src/roads/render.ts`                               |
| City         | `apps/web/src/city` — districts, lots, buildings, vegetation |
| Terrain      | `apps/web/src/natural`, `apps/web/src/world`                 |
| Interface    | `apps/web/index.html`, `apps/web/src/ui`                     |
| Assets       | `apps/web/public/assets/sity` — manifest-driven pack         |

The scene and the road model are described in [docs/architecture/scene.md](docs/architecture/scene.md); the performance budget and
the verification in [docs/architecture/performance-and-verification.md](docs/architecture/performance-and-verification.md).

## Quick start

1. Install dependencies

```bash
npm ci
```

2. Run the app

```bash
npm run dev
```

Vite serves the app on <http://localhost:5173>. There is no platform-ops
dependency: the site needs no OpenBao, no Tolgee and no database.

3. Or run it the way the platform would

```bash
npm run local:up
```

That builds `apps/web/Dockerfile` (a Vite build served by unprivileged nginx)
and starts it on <http://localhost:3031> on the shared `platform_ops_shared`
network, which the script creates if it does not exist yet.

For an edit-and-refresh loop in the container instead of a rebuild:

```bash
npm run local:dev
```

Same port, but the container builds its `dev` stage and runs the Vite dev
server under `docker compose watch`, which copies changed `apps/web/src` into
it. Dependency manifests trigger a rebuild rather than a sync. Both modes are
the same service on the same port, so run one at a time.

4. Stop it

```bash
npm run local:down
```

`npm run local:reset` forces a no-cache rebuild — there are no volumes to drop,
the app is static.

First run, and what to do when something is missing:
[docs/local-first-start.md](docs/local-first-start.md).

## Quality commands

```bash
npm run precommit:checks
```

That is what the pre-commit hook runs: gitleaks over the staged diff, then format check, lint, typecheck,
unit tests with coverage, and the build. The unit tests cover the network builder, the lane graph and the
city plan under Vitest, without a browser.

```bash
npm run build
npm run e2e -w @sity/web
```

The Playwright suite serves the built site with `vite preview`, loads the scene in Chromium with software
WebGL, and checks the asset pack, the lane-graph invariants, routing between the ring highway and Main
Street, the city and vegetation counts, the draw-call and triangle budgets, every camera view (pixel
samples, screenshots kept as test output) and the panel against WCAG A and AA with axe.

## Release + deploy model

- `Release Please` manages versioning/changelog + release PR.
- There is no deploy workflow yet, because the scene has no host until vehicles and traffic devices exist.
- CI runs the quality commands above, plus gitleaks over the full history, a Docker smoke test of the
  image, a licence gate, `npm audit` on production dependencies, an SBOM and Trivy scan of the image,
  Semgrep, CodeQL, dependency review and commitlint.

## Layout

```
apps/web/            the Vite app (index.html, src, public, e2e)
docker/              app-local and app-dev compose manifests
docs/                first-run guide, with the scene and performance notes under docs/architecture
scripts/             husky bootstrap, gitleaks pre-commit, licence and audit gates, local stack
.github/workflows/   ci, codeql, commitlint, dependency review, auto-merge, release-please
```
