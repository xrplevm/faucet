# XRPL EVM Faucet

Web faucet for the XRPL EVM Sidechain. Supports two networks:

- **Testnet** — bridges XRP from XRPL Testnet through the Axelar gateway. The Ripple altnet faucet funds an ephemeral XRPL wallet, which then sends a `Payment` carrying interchain-transfer memos to the bridge gateway. Status is tracked client-side by polling Axelar's GMP indexer (primary) and the XRPL EVM explorer's token-transfers endpoint (fallback).
- **Devnet** — mints XRP directly. The browser POSTs the user's address to a Vercel API route (`/api/devnet-faucet`), which signs `mint(address, 100e18)` against the native XRP ERC20 at `0xEee…EEeE` using a server-held private key.

Built with Next.js 16 (App Router), React 19, Tailwind v4, viem, and `xrpl@4.5`.

## Networks

| | Testnet | Devnet |
| --- | --- | --- |
| Chain ID | `1449000` (`0x161228`) | `1449900` (`0x161FAC`) |
| RPC | `https://rpc.testnet.xrplevm.org/` | `https://rpc.devnet.xrplevm.org/` |
| Explorer | `https://explorer.testnet.xrplevm.org` | `https://explorer.devnet.xrplevm.org` |
| Faucet amount | 97 XRP | 100 XRP |
| Mechanism | XRPL → bridge | Direct ERC20 mint |
| Anti-abuse | None (open) | None (open) |

## Local development

```bash
npm install
cp .env.example .env.local
# fill in DEVNET_FAUCET_PRIVATE_KEY
npm run dev
```

Open [http://localhost:5089](http://localhost:5089).

The Testnet flow works without any env vars. The Devnet flow requires `DEVNET_FAUCET_PRIVATE_KEY` to be set to a funded EOA that has permission to call `mint` on the native XRP ERC20.

## API

### `POST /api/devnet-faucet`

Submits a `mint(address, 100e18)` transaction on XRPL EVM Devnet and returns the broadcast hash. Confirmation is the client's job — see `lib/use-poll-devnet-tx-status.ts`, which polls `eth_getTransactionReceipt` against the public RPC every 2s for up to ~2 min.

Request:
```json
{ "address": "0x..." }
```

Response (200):
```json
{ "txHash": "0x..." }
```

Errors:
- `400` — invalid JSON body or invalid EVM address
- `500` — `DEVNET_FAUCET_PRIVATE_KEY` not configured or `writeContract` rejected (e.g. signer lacks mint permission, RPC down)

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DEVNET_FAUCET_PRIVATE_KEY` | Yes (Devnet only) | EOA private key authorised to call `mint(address,uint256)` on `0xEee…EEeE`. With or without the `0x` prefix. |

See `.env.example`.

## Deployment

The project deploys to Vercel as-is — `app/api/devnet-faucet/route.ts` is picked up as a serverless function automatically. Set `DEVNET_FAUCET_PRIVATE_KEY` in the Vercel project's environment variables (Production + Preview as needed) before the first deploy.

## Project layout

```
app/
  page.tsx                       Single-page UI shell
  layout.tsx                     Root layout, fonts, branding
  api/devnet-faucet/route.ts     Devnet mint endpoint
components/
  faucet.tsx                     Main faucet form (network selector, request flow, modal)
  connect-wallet-button.tsx      MetaMask connect / disconnect
  metamask-button.tsx            "Add network to MetaMask" buttons + chain configs
  bridging-progress.tsx          Spinner + rotating trivia (Testnet only)
  ...
lib/
  use-get-xrp.ts                 Testnet bridge flow (XRPL faucet → bridge payment)
  use-mint-xrp.ts                Devnet flow (POST to API route)
  use-poll-devnet-tx-status.ts        eth_getTransactionReceipt polling (Devnet only)
  use-poll-destination-tx-status.ts   Axelar + explorer polling (Testnet only)
```

## Notes

- The "Follow on X" / "Join Discord" gate is a client-side honor system, not a security check.
- The Devnet endpoint has no rate limit or anti-bot protection. If you need either later, the natural fit is Upstash Redis for per-address / per-IP `SET NX EX` rate limits, plus Cloudflare Turnstile for browser attestation.
- Concurrent Devnet requests share one signer key; viem auto-fetches nonces per call, so simultaneous requests can collide. If traffic warrants it, add a queue or use viem's nonce manager.
