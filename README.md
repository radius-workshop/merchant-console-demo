# merchant-console-demo

EdgeMeter — a Railway-first demo of [Radius x402](https://radiustech.xyz) paid API endpoints. A fictional security-intelligence vendor exposes four GET endpoints, each gated by an HTTP 402 + x402 payment requirement. Pay-per-call settles in SBC on Radius Mainnet (or Testnet) via a facilitator, then returns the JSON response.

**Live demo:** https://merchant-console-demo-production.up.railway.app

> **This is a demo, not production software.** It exists to illustrate the x402 payment flow on Radius. Stats are in-memory and reset on every deploy, the response payloads are deterministic fakes, and there is no rate limiting, authentication, or persistence. By default it points at Radius **Mainnet** and moves real SBC on every paid call — fork it for learning, don't ship it as a real payment processor.

## What it shows

- **HTTP 402 + x402** payment-required responses with EIP-712/Permit2 payment requirements
- **Verify + settle** flow against a Radius facilitator (`facilitator.radiustech.xyz` / `facilitator.testnet.radiustech.xyz`)
- **Sub-second settlement** on Radius — measured per request and surfaced in the UI
- A merchant-side console UI rendering live stats, recent paid events, and a swarm visualization of agent traffic

## Endpoints

| ID | Path | Price | Purpose |
|---|---|---|---|
| `threat` | `GET /api/x402/threat/:ip` | 0.00025 SBC | Reputation, bot probability, network owner for an IP |
| `bot-score` | `GET /api/x402/bot-score/:domain` | 0.00005 SBC | Machine-traffic likelihood for a domain |
| `reputation` | `GET /api/x402/reputation/:indicator` | 0.00010 SBC | Risk history for an IP/domain/wallet/UA |
| `url-risk` | `GET /api/x402/url-risk?url=...` | 0.00040 SBC | Phishing/malware/automation signals for a URL |

Switch network with `?network=testnet`. Default is mainnet.

Free metadata endpoints: `/api/health`, `/api/catalog`, `/api/baseline`, `/api/stats`.

## Local development

```bash
npm install
npm run dev          # tsx, hot-reload-ish
# or
npm run build && npm run start
```

Server listens on `process.env.PORT ?? 3000`.

## Deploy

Already configured for Railway via `railway.toml` (RAILPACK builder). To redeploy from local:

```bash
railway up --detach -m "your message"
```

GitHub auto-deploy on push is **not yet wired** — the Railway GitHub app needs to be installed on the `radius-workshop` org (https://github.com/apps/railway-app/installations/new) by a GitHub org owner. Once installed, attach via the Railway dashboard or `railway add --repo radius-workshop/merchant-console-demo`.

## Configuration

All env vars are optional — sane mainnet + testnet defaults live in `src/network-config.ts`. Override per-network with `_MAINNET` / `_TESTNET` suffixes (or set the unsuffixed name to apply to both):

| Var | Default |
|---|---|
| `PORT` | `3000` |
| `PAYMENT_ADDRESS` | `0xDA60059faBf3e71338c27C505CED519f55d605DD` |
| `SBC_TOKEN_ADDRESS` | `0x33ad9e4bd16b69b5bfded37d8b5d9ff9aba014fb` (mainnet) |
| `RPC_URL_MAINNET` / `RPC_URL_TESTNET` | Radius public RPCs |
| `FACILITATOR_API_KEY` | unset (no auth header sent) |
| `X402_PERMIT2_PROXY` | `0x402085c248EeA27D92E8b30b2C58ed07f9E20001` |
| `BATCH_CONTRACT_ADDRESS` | network-specific |

## Tech notes

- Pure Node.js HTTP server (`node:http`) — no Express, Fastify, or any production dependencies.
- TypeScript with NodeNext module resolution; imports use `.js` extensions.
- Stats are in-memory only; a redeploy resets them.
- Frontend HTML and the swarm visualization JS are server-rendered from TS in `src/frontend.ts` and `src/swarm.ts`.
