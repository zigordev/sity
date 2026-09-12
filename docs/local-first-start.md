# Local first start

What a fresh checkout needs before the scene runs, and what to do when a step
fails. sity is the one product in the estate with no platform dependencies: no
OpenBao secret, no Tolgee project, no database, no shared broker. The only thing
it shares with the platform is the Docker network, and only when you run it as a
container.

## 1. Toolchain

Node is pinned in `.nvmrc`, and the repository refuses to install under an older
major because `engines` declares it:

```bash
nvm use
node -v
```

The shell default on a fresh machine is usually not 24, and the pre-commit hook
runs Node from the shell it inherits — if the hook fails with an unexpected
syntax or engine error, this is why.

```bash
npm ci
```

## 2. The scene, straight from Vite

```bash
npm run dev
```

Vite serves <http://localhost:5173>. Nothing else has to be running. The whole
city is generated at load time from the plans in `apps/web/src`, so a working
scene here means the checkout is complete — there is no seed data and no first
migration.

The debug API is attached to `window.__SITY_DEBUG__` in the browser console; the
end-to-end suite drives the same surface.

## 3. The scene as the platform runs it

```bash
npm run local:up
```

This builds `apps/web/Dockerfile` — a Vite production build served by
unprivileged nginx — and publishes it on <http://localhost:3031>, attached to
the shared `platform_ops_shared` network. The script creates that network if it
does not exist, so this works whether or not the platform-ops stack is up.

For an edit-and-refresh loop inside the container:

```bash
npm run local:dev
```

Same port, but the container builds its `dev` stage and runs the Vite dev server
under `docker compose watch`. Changed files under `apps/web/src` and
`apps/web/public` are copied in; `package.json`, `package-lock.json` and
`vite.config.ts` trigger a rebuild instead. Both modes publish 3031, so run one
at a time.

```bash
npm run local:down     # stop it
npm run local:reset    # no-cache rebuild, then start again
```

`local:reset` exists to rule out a stale image, not to clear data: the app is
static and has no volumes.

## 4. Checks before committing

```bash
npm run precommit:checks
```

Gitleaks over the staged diff, then format check, lint, typecheck, unit tests
with coverage, and the build — the same commands CI runs. The browser suite is
separate because it needs a built site and a Chromium download:

```bash
npm run build
npm run e2e -w @sity/web
```

## When a step fails

- **`npm run dev` serves a black window.** The scene needs WebGL. Check
  `chrome://gpu` or run the Playwright suite, which uses software WebGL on
  purpose and will fail with a real error rather than a blank canvas.
- **`local:up` cannot reach the network.** Nothing to fix in platform-ops —
  the script creates `platform_ops_shared` itself. A failure here is Docker not
  running.
- **Port 3031 is busy.** A previous `local:up` or `local:dev` is still running;
  `npm run local:down` clears it.
- **The pre-commit hook fails with no obvious error.** Run
  `npm run precommit:checks` directly: the hook swallows nothing, but it runs in
  a smaller environment, and the usual cause is a Node version older than
  `.nvmrc`.
- **The asset pack check fails in the browser suite.** Regenerate it with
  `npm run generate:assets -w @sity/web`; the manifest is tracked, so a stale
  pack shows up as a missing-asset assertion.

## Where to go next

- [docs/architecture/scene.md](architecture/scene.md) — the scene, the road model and the lane graph.
- [docs/architecture/performance-and-verification.md](architecture/performance-and-verification.md) — the
  performance budget and what the verification suite proves.
