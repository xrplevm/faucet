"use client";

import React, { useState, useEffect, useMemo, JSX } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { ConnectWalletButton } from "./connect-wallet-button";
import { MetamaskButton } from "./metamask-button";
import { BridgingProgress } from "./bridging-progress";
import { useGetXrp } from "@/lib/use-get-xrp";
import { useMintXrp } from "@/lib/use-mint-xrp";
import { usePollDestinationTxStatus, type BridgeStep } from "../lib/use-poll-destination-tx-status";
import { usePollDevnetTxStatus } from "@/lib/use-poll-devnet-tx-status";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export type NetworkType = "Testnet" | "Devnet";

interface NetworkSpec {
  id: NetworkType;
  label: string;
  tag: string;
  description: string;
  chainId: number;
  chainIdHex: string;
  rpc: string;
  explorer: string;
  amount: number;
  cooldown: string;
  latency: string;
  bridged: boolean;
}

const NETWORKS: NetworkSpec[] = [
  {
    id: "Testnet",
    label: "Testnet",
    tag: "Public",
    description: "Bridges from XRPL testnet → XRPL EVM. Best for integration testing.",
    chainId: 1449000,
    chainIdHex: "0x" + Number(1449000).toString(16),
    rpc: "rpc.testnet.xrplevm.org",
    explorer: "explorer.testnet.xrplevm.org",
    amount: 97,
    cooldown: "24 h",
    latency: "~2 min",
    bridged: true,
  },
  {
    id: "Devnet",
    label: "Devnet",
    tag: "Internal",
    description: "Direct mint on XRPL EVM devnet. Fast, no bridging, no rate limits.",
    chainId: 1449900,
    chainIdHex: "0x" + Number(1449900).toString(16),
    rpc: "rpc.devnet.xrplevm.org",
    explorer: "explorer.devnet.xrplevm.org",
    amount: 100,
    cooldown: "None",
    latency: "~5 sec",
    bridged: false,
  },
];

const NETWORK_BY_ID: Record<NetworkType, NetworkSpec> = {
  Testnet: NETWORKS[0],
  Devnet: NETWORKS[1],
};

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const looksLikeEvmStart = (a: string) => /^0x[0-9a-fA-F]{0,40}$/.test(a.trim());

interface FaucetProps {
  network: NetworkType;
  setNetwork: React.Dispatch<React.SetStateAction<NetworkType>>;
  evmAddressFromHeader?: string;
}

const getEthereumProvider = (): MetaMaskInpageProvider | undefined => {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum as MetaMaskInpageProvider;
  }
  return undefined;
};

function DiagonalGrid({ side }: { side: "left" | "right" }) {
  const lines = Array.from({ length: 36 });
  const driftClass = side === "left" ? "animate-grid-drift-left" : "animate-grid-drift-right";
  const colorClass = side === "left" ? "bg-violet-500" : "bg-emerald-400";
  const positionClass = side === "left" ? "-left-40" : "-right-40";
  // Radial mask so the panel feathers into the background instead of clipping at a square edge.
  const maskOrigin = side === "left" ? "top left" : "top right";
  const fadeMask = `radial-gradient(120% 120% at ${maskOrigin}, black 0%, black 30%, transparent 78%)`;
  return (
    <div
      className={`pointer-events-none absolute -top-12 ${positionClass} h-[720px] w-[720px] overflow-hidden opacity-70`}
      style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
      aria-hidden
    >
      <div className={`relative h-full w-full ${driftClass}`}>
        {lines.map((_, i) => (
          <span
            key={i}
            className={`absolute left-0 h-px w-full animate-grid-line ${colorClass}`}
            style={{ top: `${i * 14}px`, animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function Faucet({ network, setNetwork, evmAddressFromHeader }: FaucetProps): JSX.Element {
  const [evmAddress, setEvmAddress] = useState<string>(evmAddressFromHeader || "");
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [socialsCompleted, setSocialsCompleted] = useState({ twitter: false, discord: false });
  const [loading, setLoading] = useState<boolean>(false);
  const [txData, setTxData] = useState<{ txHash: string; sourceCloseTimeIso: string } | null>(null);
  const [showMissingRequirementsModal, setShowMissingRequirementsModal] = useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [showInvalidAddressModal, setShowInvalidAddressModal] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [devnetSubmitError, setDevnetSubmitError] = useState<boolean>(false);
  const [devnetTxHash, setDevnetTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const ethereum = getEthereumProvider();
  const hasMetaMask: boolean = Boolean(ethereum);

  const getXrp = useGetXrp("testnet");
  const mintXrp = useMintXrp();
  const { status: devnetPollStatus } = usePollDevnetTxStatus(devnetTxHash ?? "");

  const current = useMemo(() => NETWORK_BY_ID[network], [network]);
  const isConnected = connectedAddress !== "";
  const validAddr = EVM_ADDRESS_RE.test(evmAddress.trim());
  const showAddrError = !!evmAddress && !validAddr && evmAddress.length > 5;

  useEffect(() => {
    setEvmAddress(evmAddressFromHeader || "");
  }, [evmAddressFromHeader]);

  useEffect(() => {
    async function fetchChainId() {
      if (hasMetaMask && ethereum) {
        try {
          const cid = await ethereum.request({ method: "eth_chainId" });
          setChainId(cid as string);
        } catch (err) {
          console.error("Failed to get chainId:", err);
        }
      }
    }
    fetchChainId();

    if (hasMetaMask && ethereum) {
      const handleChainChanged = (...args: unknown[]): void => {
        const [chain] = args;
        if (typeof chain === "string") setChainId(chain);
      };
      ethereum.on("chainChanged", handleChainChanged);
      return () => {
        ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [hasMetaMask, ethereum, connectedAddress]);

  const desiredChainId = "0x" + current.chainId.toString(16);
  const isOnDesiredChain = !!chainId && chainId.toLowerCase() === desiredChainId.toLowerCase();

  const { status, destinationTxHash, bridgingTimeMs, bridgeStep } = usePollDestinationTxStatus(
    evmAddress,
    txData ? txData.sourceCloseTimeIso : "",
    txData ? txData.txHash : "",
    network
  );

  const handleRequestXRP = async (): Promise<void> => {
    if (!socialsCompleted.twitter || !socialsCompleted.discord) {
      setShowMissingRequirementsModal(true);
      return;
    }
    if (!validAddr) {
      setShowInvalidAddressModal(true);
      return;
    }

    setLoading(true);
    if (network === "Devnet") {
      setDevnetSubmitError(false);
      setDevnetTxHash(null);
      setTxData({ txHash: "", sourceCloseTimeIso: "" });
      setShowTxModal(true);
      try {
        const hash = await mintXrp(evmAddress);
        setDevnetTxHash(hash);
      } catch (error: unknown) {
        console.error("Error minting devnet XRP:", error);
        setDevnetSubmitError(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const txHash = await getXrp(evmAddress);
      const closeTimeIso = new Date().toISOString();
      setTxData({ txHash, sourceCloseTimeIso: closeTimeIso });
      setShowTxModal(true);
    } catch (error: unknown) {
      console.error("Error requesting faucet:", error);
      alert("Error requesting faucet: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  function copyAddr() {
    if (!evmAddress) return;
    navigator.clipboard?.writeText(evmAddress).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <>
      {/* Aura + ambient animations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-[1]">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] blur-3xl opacity-80 animate-faucet-aura"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, oklch(0.5 0.3 296.7 / 0.20), transparent 55%), radial-gradient(circle at 80% 80%, oklch(0.7602 0.15 296.58 / 0.12), transparent 55%)",
          }}
        />
        {/* Floating orbs */}
        <div className="absolute left-[20%] top-[22%] h-80 w-80 rounded-full blur-3xl bg-violet-600/20 animate-orb-a" />
        <div className="absolute right-[20%] top-[34%] h-72 w-72 rounded-full blur-3xl bg-emerald-500/10 animate-orb-b" />
        {/* Diagonal grid panels */}
        <DiagonalGrid side="left" />
        <DiagonalGrid side="right" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-8 pt-8 md:pt-16 pb-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 mb-8 md:mb-14">
          <div className="text-white/95 animate-fade-in-left min-w-0">
            <Logo className="w-36 h-8 sm:w-44 sm:h-10" />
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-white/50 animate-fade-in-down">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" />
            <span>All systems operational</span>
            <span className="text-white/15">·</span>
            <span>v2.4</span>
          </div>
        </header>

        {/* Title */}
        <div className="mb-8 md:mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-white/40 mb-3 font-medium animate-fade-in-up">
            XRPL EVM Faucet
          </p>
          <h1 className="text-[28px] sm:text-[34px] md:text-[44px] leading-[1.1] md:leading-[1.05] tracking-tight font-semibold animate-blur-reveal break-words">
            Get test XRP, to your wallet
            <span className="animate-gradient-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent"> in seconds.</span>
          </h1>
          <p className="mt-3 text-sm sm:text-[15px] text-white/55 leading-relaxed animate-fade-in-up [animation-delay:280ms]">
            Get test XRP delivered on the XRPL EVM sidechain. Pick a
            network, <b>CONNECT</b> or <b>PASTE</b> your address, and you&apos;re set.
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-xl bg-white/[0.025] border border-white/10 backdrop-blur-xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] animate-card-rise overflow-hidden">
          {/* Animated top border highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-edge-shimmer"
          />
          <div className="relative p-4 sm:p-5 md:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 md:gap-8">
            {/* LEFT — Form */}
            <div className="space-y-7 min-w-0">
              {/* Step 1 — Wallet */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium mb-1">
                    Step 1
                  </div>
                  <h2 className="text-base font-semibold">Connect or paste an address</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ConnectWalletButton
                    className="h-11 px-4 text-sm rounded-xl"
                    onConnected={(addr: string) => {
                      setConnectedAddress(addr);
                      setEvmAddress(addr);
                    }}
                    onDisconnected={() => setConnectedAddress("")}
                  />
                  {hasMetaMask && !isOnDesiredChain && (
                    <MetamaskButton className="h-11 px-3 text-xs rounded-xl" network={network} />
                  )}
                </div>
              </div>

              {/* Address field */}
              <div>
                <label className="text-xs text-white/45 mb-2 block font-medium">
                  Recipient address
                </label>
                <div
                  className={`flex items-center gap-2 h-12 rounded-xl border bg-white/[0.03] focus-within:border-primary/60 focus-within:bg-white/[0.05] transition-colors px-3 ${
                    showAddrError ? "border-rose-500/40" : "border-white/10"
                  }`}
                >
                  <span className="text-white/30 text-sm shrink-0">›</span>
                  <input
                    value={evmAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvmAddress(e.target.value)}
                    disabled={isConnected}
                    placeholder="0x5l8r9m… your EVM address"
                    spellCheck={false}
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-[15px] placeholder:text-white/25 disabled:text-white/70 disabled:cursor-not-allowed"
                  />
                  {evmAddress && (
                    <button
                      onClick={copyAddr}
                      type="button"
                      className="shrink-0 text-[11px] text-white/45 hover:text-white/85 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors font-medium"
                      title="Copy"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                  {validAddr && (
                    <span className="shrink-0 size-5 rounded-full bg-emerald-500/20 grid place-items-center">
                      <svg
                        viewBox="0 0 16 16"
                        className="size-3 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 8l3.5 3.5L13 5" />
                      </svg>
                    </span>
                  )}
                </div>
                {showAddrError && looksLikeEvmStart(evmAddress) && (
                  <p className="text-[12px] text-rose-300/80 mt-1.5">
                    Keep typing — address must be 42 characters long.
                  </p>
                )}
                {showAddrError && !looksLikeEvmStart(evmAddress) && (
                  <p className="text-[12px] text-rose-300/80 mt-1.5">
                    Address must start with 0x and use only hex characters.
                  </p>
                )}
              </div>

              {/* Step 2 — Network cards */}
              <div>
                <div className="mb-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium mb-1">
                    Step 2
                  </div>
                  <h2 className="text-base font-semibold">Pick a network</h2>
                </div>
                <NetworkCards value={network} onChange={setNetwork} />
              </div>

              {/* Step 3 — Tasks */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium mb-1">
                  Step 3
                </div>
                <h2 className="text-base font-semibold mb-3">Complete to unlock the faucet</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <TaskRow
                    icon="/logos/x.png"
                    title="Follow @Peersyst on 𝕏"
                    href="https://x.com/Peersyst"
                    done={socialsCompleted.twitter}
                    onClick={() => setSocialsCompleted((s) => ({ ...s, twitter: true }))}
                  />
                  <TaskRow
                    icon="/logos/discord.png"
                    title="Join our Discord"
                    href="https://discord.com/invite/xrplevm"
                    done={socialsCompleted.discord}
                    onClick={() => setSocialsCompleted((s) => ({ ...s, discord: true }))}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT — Order summary */}
            <aside className="lg:sticky lg:top-6 lg:self-start animate-fade-in-right min-w-0">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5">
                {/* Decorative rotating ring */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-primary/30 animate-spin-slow"
                />

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-[36px] sm:text-[44px] leading-none font-semibold tracking-tight">
                    {current.amount}
                  </span>
                  <span className="text-white/50 text-sm">XRP</span>
                </div>

                <dl className="text-xs space-y-2.5">
                  <SummaryRow label="Network" value={current.label} />
                  <SummaryRow label="Chain ID" value={String(current.chainId)} />
                  <SummaryRow label="ETA" value={current.latency} />
                  <SummaryRow label="Method" value={current.bridged ? "Bridge from XRPL" : "Direct mint"} />
                </dl>

                <button
                  onClick={handleRequestXRP}
                  disabled={loading || !!txData}
                  className="mt-6 w-full min-h-12 h-12 rounded-xl text-sm sm:text-[15px] font-semibold relative overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed text-white px-4"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.5 0.3 296.7) 0%, oklch(0.42 0.28 296.7) 100%)",
                    boxShadow:
                      "0 10px 30px -8px oklch(0.5 0.3 296.7 / 0.5), inset 0 1px 0 rgba(255,255,255,0.18)",
                  }}
                >
                  <span className="relative z-10">
                    {loading ? "Preparing transaction…" : `Request ${current.amount} XRP`}
                  </span>
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Below card meta */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/40">
          <span className="break-all">
            RPC: <span className="text-white/65">{current.rpc}</span>
          </span>
          <span className="break-all">
            Explorer: <span className="text-white/65">{current.explorer}</span>
          </span>
        </div>
      </main>

      {/* Tx modal */}
      <TransactionStatusModal
        open={showTxModal}
        onOpenChange={(open) => {
          setShowTxModal(open);
          const isDevnet = network === "Devnet";
          const effective = isDevnet
            ? devnetSubmitError
              ? "Failed"
              : devnetPollStatus
            : status;
          const terminal = effective === "Arrived" || effective === "Failed" || effective === "Timeout";
          if (!open && isDevnet && terminal) {
            setTxData(null);
            setDevnetTxHash(null);
            setDevnetSubmitError(false);
          }
        }}
        network={current}
        isDevnet={network === "Devnet"}
        bridgeStatus={status}
        bridgeStep={bridgeStep}
        devnetStatus={devnetPollStatus}
        devnetSubmitError={devnetSubmitError}
        devnetTxHash={devnetTxHash}
        destinationTxHash={destinationTxHash}
        bridgingTimeMs={bridgingTimeMs}
        onClose={() => setShowTxModal(false)}
      />

      {/* Missing tasks */}
      {showMissingRequirementsModal && (
        <AlertDialog
          open={showMissingRequirementsModal}
          onOpenChange={setShowMissingRequirementsModal}
        >
          <AlertDialogContent className="bg-[#0c0c0c] border-white/12 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">Almost there</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-white/55 text-center">
              Follow on 𝕏 and join the Discord before requesting test XRP.
            </p>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setShowMissingRequirementsModal(false)}
                className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
              >
                Got it
              </button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Invalid address */}
      {showInvalidAddressModal && (
        <AlertDialog open={showInvalidAddressModal} onOpenChange={setShowInvalidAddressModal}>
          <AlertDialogContent className="bg-[#0c0c0c] border-white/12 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">Invalid EVM address</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-white/55 text-center">
              Please enter a valid 0x-prefixed, 42-character address.
            </p>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setShowInvalidAddressModal(false)}
                className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <style jsx global>{`
        @keyframes faucet-aura {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 30px) scale(1.08); }
        }
        .animate-faucet-aura {
          animation: faucet-aura 18s ease-in-out infinite;
        }
        @keyframes gradient-text {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        .animate-gradient-text {
          animation: gradient-text 6s ease infinite;
        }

        /* Floating orbs */
        @keyframes orb-drift-a {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(14px, -24px); opacity: 0.55; }
        }
        @keyframes orb-drift-b {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(-12px, -18px); opacity: 0.5; }
        }
        .animate-orb-a { animation: orb-drift-a 7s ease-in-out infinite; }
        .animate-orb-b { animation: orb-drift-b 7s ease-in-out 1.2s infinite; }

        /* Diagonal grid drift + per-line shimmer */
        @keyframes grid-drift-left {
          0%, 100% { transform: rotate(-45deg) translate(0, 0); }
          50% { transform: rotate(-45deg) translate(-18px, -10px); }
        }
        @keyframes grid-drift-right {
          0%, 100% { transform: rotate(45deg) translate(0, 0); }
          50% { transform: rotate(45deg) translate(-18px, -10px); }
        }
        @keyframes grid-line-pulse {
          0%, 100% { opacity: 0.15; transform: scaleX(0.7); }
          50% { opacity: 0.85; transform: scaleX(1); }
        }
        .animate-grid-drift-left { animation: grid-drift-left 8s ease-in-out infinite; }
        .animate-grid-drift-right { animation: grid-drift-right 8s ease-in-out infinite; }
        .animate-grid-line { animation: grid-line-pulse 3.2s ease-in-out infinite; transform-origin: left center; }

        /* Card top edge shimmer */
        @keyframes edge-shimmer {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.65; }
        }
        .animate-edge-shimmer { animation: edge-shimmer 4s ease-in-out infinite; }

        /* Slow spin for decorative ring */
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 16s linear infinite; }

        /* Entrance animations */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blur-reveal {
          from { opacity: 0; transform: translateY(24px); filter: blur(12px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes card-rise {
          from { opacity: 0; transform: translateY(38px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out both; }
        .animate-fade-in-down { animation: fade-in-down 0.7s ease-out 0.25s both; }
        .animate-fade-in-left { animation: fade-in-left 0.7s ease-out both; }
        .animate-fade-in-right { animation: fade-in-right 0.8s ease-out 0.48s both; }
        .animate-blur-reveal { animation: blur-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
        .animate-card-rise { animation: card-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-orb-a, .animate-orb-b,
          .animate-grid-drift-left, .animate-grid-drift-right, .animate-grid-line,
          .animate-edge-shimmer, .animate-spin-slow,
          .animate-fade-in-up, .animate-fade-in-down,
          .animate-fade-in-left, .animate-fade-in-right,
          .animate-blur-reveal, .animate-card-rise,
          .animate-faucet-aura, .animate-gradient-text {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function NetworkCards({
  value,
  onChange,
}: {
  value: NetworkType;
  onChange: (id: NetworkType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {NETWORKS.map((n) => {
        const active = n.id === value;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onChange(n.id)}
            aria-pressed={active}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              active
                ? "bg-primary/15 border-primary/60 text-white"
                : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white/85"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${active ? "bg-secondary" : "bg-white/30"}`}
              aria-hidden
            />
            {n.label}
            <span className="font-normal text-[11px] opacity-70">{n.amount} XRP</span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2 last:border-0">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-white/85 truncate">{value}</dd>
    </div>
  );
}

function TaskRow({
  icon,
  title,
  href,
  done,
  onClick,
}: {
  icon: string;
  title: string;
  href: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={`flex items-center gap-3 h-14 px-4 rounded-xl border transition-all ${
        done
          ? "bg-emerald-500/[0.06] border-emerald-500/25"
          : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
      }`}
    >
      <span
        className={`size-8 rounded-xl grid place-items-center flex-shrink-0 ${
          done ? "bg-emerald-500/15" : "bg-white/[0.06]"
        }`}
      >
        <img src={icon} alt="" className="size-4 object-contain opacity-90" />
      </span>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <span
        className={`size-5 rounded-full grid place-items-center transition-all ${
          done ? "bg-emerald-500" : "bg-white/[0.06] border border-white/15"
        }`}
      >
        {done ? (
          <svg
            viewBox="0 0 16 16"
            className="size-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8l3.5 3.5L13 5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            className="size-3 text-white/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 3l5 5-5 5" />
          </svg>
        )}
      </span>
    </Link>
  );
}

// ─── Tx modal ────────────────────────────────────────────────────────────────

interface TxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkSpec;
  isDevnet: boolean;
  bridgeStatus: "Pending" | "Arrived" | "Failed" | "Timeout";
  bridgeStep: BridgeStep;
  devnetStatus: "Pending" | "Arrived" | "Failed" | "Timeout";
  devnetSubmitError: boolean;
  devnetTxHash: string | null;
  destinationTxHash: string | null;
  bridgingTimeMs: number | null;
  onClose: () => void;
}

const BRIDGE_STEPS: { id: BridgeStep; label: string; sub: string }[] = [
  { id: "submitted", label: "Submitted to XRPL", sub: "Source payment broadcast" },
  { id: "confirmed", label: "Witnessed by Axelar", sub: "Validators confirmed the XRPL tx" },
  { id: "approved", label: "Approved by gateway", sub: "Multisig signed the EVM relay" },
  { id: "executed", label: "Delivered on XRPL EVM", sub: "Mint executed on destination" },
];

const BRIDGE_STEP_RANK: Record<BridgeStep, number> = {
  submitted: 0,
  confirmed: 1,
  approved: 2,
  executed: 3,
};

function TransactionStatusModal({
  open,
  onOpenChange,
  network,
  isDevnet,
  bridgeStatus,
  bridgeStep,
  devnetStatus,
  devnetSubmitError,
  devnetTxHash,
  destinationTxHash,
  bridgingTimeMs,
  onClose,
}: TxModalProps) {
  const effectiveStatus = isDevnet ? (devnetSubmitError ? "Failed" : devnetStatus) : bridgeStatus;
  const effectiveTxHash = isDevnet ? devnetTxHash : destinationTxHash;
  const explorerUrl = effectiveTxHash ? `https://${network.explorer}/tx/${effectiveTxHash}` : null;
  const bridgingTimeSec = !isDevnet && bridgingTimeMs ? Math.floor(bridgingTimeMs / 1000) : 0;

  const isPending = effectiveStatus === "Pending";
  const isDone = effectiveStatus === "Arrived";
  const isFailure = effectiveStatus === "Failed" || effectiveStatus === "Timeout";

  let dotClass = "bg-amber-400 animate-pulse";
  let title = "Transaction in progress";
  if (isDone) {
    dotClass = "bg-emerald-400";
    title = "Transaction confirmed";
  } else if (isFailure) {
    dotClass = "bg-rose-400";
    title = effectiveStatus === "Timeout" ? "Transaction timed out" : "Transaction failed";
  }

  let statusLabel = "Pending";
  if (isDone) statusLabel = "Done";
  else if (isFailure) statusLabel = effectiveStatus;

  let statusToneClass = "text-amber-200";
  if (isDone) statusToneClass = "text-emerald-300";
  else if (isFailure) statusToneClass = "text-rose-300";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0c0c0c] border-white/12">
        <AlertDialogHeader>
          <AlertDialogTitle className="sr-only">Transaction status</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 mb-1">
          <span className={`size-2.5 rounded-full ${dotClass} shadow-[0_0_10px_currentColor]`} />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Status</span>
            <span className={`text-xs font-semibold ${statusToneClass}`}>{statusLabel}</span>
          </div>

          {isPending && isDevnet && (
            <>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  style={{
                    width: devnetTxHash ? "78%" : "20%",
                    transition: "width 4s ease-out",
                  }}
                />
              </div>
              <p className="text-xs text-white/45 mt-2">
                {devnetTxHash ? "Minting directly on devnet…" : "Submitting mint transaction…"}
              </p>
            </>
          )}

          {isPending && !isDevnet && (
            <>
              <BridgeStepList currentStep={bridgeStep} />
              <BridgingProgress className="mt-3" />
            </>
          )}

          {isDone && effectiveTxHash && (
            <>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1">
                Tx hash
              </div>
              {explorerUrl ? (
                <Link
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-secondary break-all hover:underline"
                >
                  {effectiveTxHash}
                </Link>
              ) : (
                <span className="text-[12px] text-secondary break-all">
                  {effectiveTxHash}
                </span>
              )}
              {bridgingTimeSec > 0 && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                    Bridging time
                  </span>
                  <span className="text-sm font-medium text-white/85">{bridgingTimeSec}s</span>
                </div>
              )}
            </>
          )}

          {isFailure && (
            <p className="text-xs text-white/55 mt-1">
              {isDevnet
                ? "We couldn't confirm the mint. Try again — the devnet has no rate limit."
                : "The bridge transfer didn't complete in time. Please try again."}
            </p>
          )}
        </div>

        {(isDone || isFailure) && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onClose}
              className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BridgeStepList({ currentStep }: { currentStep: BridgeStep }) {
  const currentRank = BRIDGE_STEP_RANK[currentStep];
  return (
    <ol className="flex flex-col gap-3 mt-1">
      {BRIDGE_STEPS.map((step, idx) => {
        const rank = BRIDGE_STEP_RANK[step.id];
        const isDone = rank < currentRank;
        const isCurrent = rank === currentRank;
        const isLast = idx === BRIDGE_STEPS.length - 1;
        return (
          <li key={step.id} className="relative flex items-start gap-3">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-6 bottom-[-12px] w-px ${
                  isDone ? "bg-primary/50" : "bg-white/10"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative size-[22px] shrink-0 rounded-full grid place-items-center transition-all ${
                isDone
                  ? "bg-primary text-white"
                  : isCurrent
                  ? "bg-primary/15 border border-primary/60"
                  : "bg-white/[0.04] border border-white/10"
              }`}
            >
              {isDone ? (
                <svg
                  viewBox="0 0 16 16"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8l3.5 3.5L13 5" />
                </svg>
              ) : isCurrent ? (
                <span className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_currentColor]" />
              ) : (
                <span className="size-1.5 rounded-full bg-white/25" />
              )}
            </span>
            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-medium break-words ${
                  isCurrent ? "text-white" : isDone ? "text-white/70" : "text-white/40"
                }`}
              >
                {step.label}
              </span>
              <span className="text-[11px] text-white/40 break-words">{step.sub}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
