import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, defineChain, http, isAddress, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NATIVE_XRP_ERC20 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;
const MINT_AMOUNT = parseEther("100");

const xrplEvmDevnet = defineChain({
  id: 1449900,
  name: "XRPL EVM Devnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.devnet.xrplevm.org"] } },
});

const mintAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = (body as { address?: unknown })?.address;
  if (typeof address !== "string" || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid EVM address" }, { status: 400 });
  }

  const rawKey = process.env.DEVNET_FAUCET_PRIVATE_KEY;
  if (!rawKey) {
    console.error("[devnet-faucet] DEVNET_FAUCET_PRIVATE_KEY is not set");
    return NextResponse.json({ error: "Faucet not configured" }, { status: 500 });
  }
  const pk = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;

  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({ account, chain: xrplEvmDevnet, transport: http() });

  try {
    const txHash = await walletClient.writeContract({
      address: NATIVE_XRP_ERC20,
      abi: mintAbi,
      functionName: "mint",
      args: [address, MINT_AMOUNT],
    });
    return NextResponse.json({ txHash });
  } catch (err) {
    console.error("[devnet-faucet] writeContract failed", err);
    const message = err instanceof Error ? err.message : "Mint submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
