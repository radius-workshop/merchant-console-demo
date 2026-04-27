# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex, etc.) working in this repo.

## What this is

A demo merchant console for the Radius x402 protocol — a Node.js HTTP server that exposes four paid API endpoints, plus a self-contained HTML+JS frontend. The user is **Tyler at Radius**, doing product/documentation work; not a heavy developer. Explain changes plainly and don't introduce abstractions beyond what's asked.

## Stack constraints (do not violate)

- **Pure `node:http`** — no Express, Fastify, Koa, or any HTTP framework.
- **Zero production dependencies.** `package.json#dependencies` is empty and stays empty. `devDependencies` are only `typescript`, `tsx`, `@types/node`. If you find yourself wanting to add a runtime dep, stop and ask — the demo's "no SDK, just viem-or-stdlib" framing is intentional.
- **TypeScript NodeNext + ESM.** Always import with `.js` extensions even from `.ts` files (e.g., `import { foo } from './bar.js'`). `package.json` has `"type": "module"`.
- **Strict TS** — no `any` shortcuts; the codebase compiles with `strict: true`.
- **`process.env.PORT` is the only port source** (see `src/server.ts:16`). Don't hardcode.
- **Stats are intentionally in-memory** (`src/stats.ts`). Don't introduce a database, Redis, or persistence — a redeploy reset is fine for a demo.

## Layout

```
src/
  server.ts          HTTP entrypoint; route table; payment outcome → JSON response mapping
  x402.ts            x402 protocol logic: build payment requirements, verify+settle via facilitator
  network-config.ts  mainnet/testnet config with env-var overrides; defaults baked in
  demo-data.ts       endpoint catalog (4 endpoints) and deterministic-fake response generation
  stats.ts           in-memory paid-request counters
  frontend.ts        server-rendered HTML+CSS+inline JS for the merchant console UI (~2k lines)
  swarm.ts           JS module served at /modules/swarm.js for the swarm visualization
```

`dist/` is gitignored; built by `tsc` to `dist/server.js`.

## Routes (all GET)

Free: `/`, `/modules/swarm.js`, `/api/health`, `/api/catalog`, `/api/baseline`, `/api/stats`.

Paid (via x402): `/api/x402/threat/:ip`, `/api/x402/bot-score/:domain`, `/api/x402/reputation/:indicator`, `/api/x402/url-risk?url=...`.

Network selection: `?network=testnet` query param; default is `mainnet` (see `getNetworkKeyFromUrl` in `src/network-config.ts`).

## Common commands

```bash
npm run dev          # tsx src/server.ts
npm run build        # tsc → dist/
npm run start        # node dist/server.js (what Railway runs)
```

There is no test suite, lint config, or formatter. Don't add one without being asked.

## Deploy

- Hosted on Railway under the **Radius Tech Systems** workspace.
- Public URL: https://merchant-console-demo-production.up.railway.app
- `railway.toml` drives the build (RAILPACK builder, healthcheck at `/api/health`).
- **Push-to-deploy is NOT wired** — pushes to `main` on GitHub do not trigger a Railway redeploy. To ship a change, run `railway up --detach -m "..."` from this directory.

## Patterns worth knowing

- **Endpoint catalog is the source of truth** (`src/demo-data.ts`). Adding a paid endpoint means: add an entry to `ENDPOINTS`, add the response builder branch in `buildPaidPayload`, and add a route in `src/server.ts`. The frontend reads `/api/catalog` and renders cards automatically.
- **Payment outcomes are a discriminated union** (`PaymentOutcome` in `src/x402.ts`). The switch in `handlePaidEndpoint` (`src/server.ts:95`) is exhaustive — TypeScript will fail compile if you add a state and don't handle it. Keep it that way.
- **Origin reconstruction respects proxies** — `getOrigin` in `src/server.ts:68` uses `x-forwarded-proto` / `x-forwarded-host`. Railway sits behind a proxy, so don't bypass it.
- **CORS is wide open** (`Access-Control-Allow-Origin: *`) — intentional for the demo.

## When in doubt

Ask Tyler. He's product/docs at Radius and prefers direct, first-principles explanations over hedged answers. Challenge assumptions when you see issues. Don't over-engineer.
