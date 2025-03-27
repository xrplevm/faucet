import React, { useState, useEffect, JSX } from "react";
import { Button } from "./ui/button";
import { BridgingProgress } from "./bridging-progress";
import { Logo } from "./logo";
import { ConnectWalletButton } from "./connect-wallet-button";
import { MetamaskButton } from "./metamask-button";
import { useGetXrp } from "@/app/useGetXrp";
import { usePollDestinationTxStatus } from "../app/usePollDestinationTxStatus";
import type { MetaMaskInpageProvider } from "@metamask/providers";

export type NetworkType = "Devnet" | "Testnet";

interface FaucetProps {
  network: NetworkType;
  setNetwork: React.Dispatch<React.SetStateAction<NetworkType>>;
  evmAddressFromHeader?: string;
}

// Get a typed reference to the Ethereum provider if it exists.
const getEthereumProvider = (): MetaMaskInpageProvider | undefined => {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum as MetaMaskInpageProvider;
  }
  return undefined;
};

export function Faucet({ network, setNetwork, evmAddressFromHeader }: FaucetProps): JSX.Element {
  const [evmAddress, setEvmAddress] = useState<string>(evmAddressFromHeader || "");
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [followedTwitter, setFollowedTwitter] = useState<boolean>(false);
  const [joinedDiscord, setJoinedDiscord] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [txData, setTxData] = useState<{ txHash: string; sourceCloseTimeIso: string } | null>(null);
  const [showMissingRequirementsModal, setShowMissingRequirementsModal] = useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string | null>(null);

  // Obtain the provider (if present) and then determine if MetaMask exists.
  const ethereum = getEthereumProvider();
  const hasMetaMask: boolean = Boolean(ethereum);

  const getXrp = useGetXrp(network.toLowerCase() as "devnet" | "testnet");

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
        if (typeof chain === 'string') {
          setChainId(chain);
        } else {
          console.error('Invalid chain ID', chain);
        }
      };
    
      ethereum.on("chainChanged", handleChainChanged);
    
      return () => {
        ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }    
  }, [hasMetaMask, ethereum, connectedAddress]);

  const isConnected = connectedAddress !== "";

  const handleRequestXRP = async (): Promise<void> => {
    if (!followedTwitter || !joinedDiscord) {
      setShowMissingRequirementsModal(true);
      return;
    }
    if (!evmAddress.startsWith("0x") || evmAddress.length < 10) {
      alert("Please enter a valid EVM address (starting with 0x).");
      return;
    }
    setLoading(true);
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

  function getDesiredChainId(network: NetworkType): string {
    return network === "Devnet"
      ? "0x" + Number(1440002).toString(16)
      : "0x" + Number(1449000).toString(16);
  }
  const desiredChainId: string = getDesiredChainId(network);
  const isOnDesiredChain: boolean = !!chainId && chainId.toLowerCase() === desiredChainId.toLowerCase();

  const { status, destinationTxHash, bridgingTimeMs } = usePollDestinationTxStatus(
    evmAddress,
    txData ? txData.sourceCloseTimeIso : "",
    txData ? txData.txHash : "",
    network
  );

  const TransactionStatusModal = (): JSX.Element | null => {
    if (!txData) return null;
    let displayedStatus = "";
    let extraMessage = "";
    switch (status) {
      case "Pending":
        displayedStatus = "Pending";
        extraMessage = "Estimated time: ~2 minutes";
        break;
      case "Arrived":
        displayedStatus = "Completed";
        break;
      case "Failed":
      case "Timeout":
        displayedStatus = "Failed";
        break;
      default:
        displayedStatus = status || "Pending";
        break;
    }
    const isBridging = displayedStatus === "Pending" || displayedStatus === "Bridging";
    const evmTxUrl = destinationTxHash
      ? (network === "Testnet"
          ? `https://explorer.testnet.xrplevm.org/tx/${destinationTxHash}`
          : `https://explorer.xrplevm.org/tx/${destinationTxHash}`)
      : null;
    const bridgingTimeSec = bridgingTimeMs ? Math.floor(bridgingTimeMs / 1000) : 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#1E1E1E] w-[500px] max-w-[90%] p-6 rounded-xl shadow-xl text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Transaction Status</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Current Status</span>
              <span className={`font-medium ${displayedStatus === "Pending" ? "animate-pulse" : ""}`}>
                {displayedStatus}
              </span>
              {extraMessage && <span className="text-sm text-gray-400">{extraMessage}</span>}
            </div>
            {isBridging && <BridgingProgress />}
            {displayedStatus === "Completed" && evmTxUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">XRPLEVM Tx Hash</span>
                <a
                  href={evmTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline break-all hover:text-green-300"
                >
                  {destinationTxHash}
                </a>
              </div>
            )}
            {bridgingTimeSec > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">Bridging Time</span>
                <span className="font-medium">{bridgingTimeSec} sec</span>
              </div>
            )}
          </div>
          <button
            className="mt-8 w-full py-3 rounded-md bg-green-600 hover:bg-green-500 font-semibold text-white"
            onClick={() => {
              setTxData(null);
              setShowTxModal(false);
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  const addressInputClass = isConnected
    ? "border border-white/30 bg-[#2E2E2E] text-gray-200 cursor-not-allowed"
    : "border border-white/20 bg-background text-foreground focus:placeholder-transparent";

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="mb-8" style={{ transform: "scale(3)", transformOrigin: "center" }}>
          <Logo />
        </div>
        <div className="mb-4 flex items-center gap-3">
          <ConnectWalletButton
            onConnected={(addr: string) => {
              setConnectedAddress(addr);
              setEvmAddress(addr);
            }}
            onDisconnected={() => {
              setConnectedAddress("");
            }}
          />
          {!hasMetaMask ? (
            <Button variant="outline" className="h-10" disabled>
              No Wallet
            </Button>
          ) : isOnDesiredChain ? (
            <Button variant="outline" className="h-10" disabled>
              Network Added
            </Button>
          ) : (
            <MetamaskButton className="h-10" network={network} />
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="network" className="font-semibold">
            Select Network
          </label>
          <select
            id="network"
            className="border rounded-md px-3 py-2 bg-background text-foreground"
            value={network}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setNetwork(e.target.value as NetworkType)
            }
          >
            <option value="Devnet">Devnet</option>
            <option value="Testnet">Testnet</option>
          </select>
        </div>
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="evmAddress" className="font-semibold">
            Your Address
          </label>
          <input
            id="evmAddress"
            type="text"
            value={evmAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvmAddress(e.target.value)}
            placeholder="0x5l8r9m..."
            disabled={isConnected}
            className={`rounded-md px-3 py-2 w-[459px] ${addressInputClass}`}
          />
        </div>
        <p className="text-center font-medium mt-4">
          Before requesting, please complete the following:
        </p>
        <ul className="flex flex-col items-center gap-2 text-center">
          <li>
            <a
              href="https://x.com/Peersyst"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setFollowedTwitter(true)}
              className="underline text-blue-400 hover:text-blue-300"
            >
              Follow @Peersyst on X
            </a>{" "}
            {followedTwitter && "✓"}
          </li>
          <li>
            <a
              href="https://discord.com/invite/xrplevm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setJoinedDiscord(true)}
              className="underline text-blue-400 hover:text-blue-300"
            >
              Join our Discord
            </a>{" "}
            {joinedDiscord && "✓"}
          </li>
        </ul>
        <Button
          variant="default"
          size="lg"
          className="mt-4"
          onClick={handleRequestXRP}
          disabled={loading}
        >
          {loading ? `Waiting ~...` : "Request 90 XRP"}
        </Button>
      </section>
      {showTxModal && txData && <TransactionStatusModal />}
      {showMissingRequirementsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-md p-6 w-[500px] text-black">
            <h2 className="text-xl font-bold mb-4">Almost there!</h2>
            <p className="mb-4">
              Please make sure you follow us on 𝕏 and join our Discord 👾 before requesting test XRP.
            </p>
            <Button variant="secondary" onClick={() => setShowMissingRequirementsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
