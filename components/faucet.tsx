import React, { useState, useEffect, JSX } from "react";
import { Button } from "./ui/button";
import { BridgingProgress } from "./bridging-progress";
import { Logo } from "./logo";
import { ConnectWalletButton } from "./connect-wallet-button";
import { MetamaskButton } from "./metamask-button";
import { useGetXrp } from "@/lib/use-get-xrp";
import { usePollDestinationTxStatus } from "../lib/use-poll-destination-tx-status";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Input } from "./ui/input";
import Link from "next/link";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

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
  const [socialsCompleted, setSocialsCompleted] = useState({
    twitter: false,
    discord: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [txData, setTxData] = useState<{ txHash: string; sourceCloseTimeIso: string } | null>(null);
  const [showMissingRequirementsModal, setShowMissingRequirementsModal] = useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [showInvalidAddressModal, setShowInvalidAddressModal] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string | null>(null);

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
        if (typeof chain === "string") {
          setChainId(chain);
        } else {
          console.error("Invalid chain ID", chain);
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
    if (!socialsCompleted.twitter || !socialsCompleted.discord) {
      setShowMissingRequirementsModal(true);
      return;
    }
    if (!evmAddress.startsWith("0x") || evmAddress.length < 10) {
      setShowInvalidAddressModal(true);
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
    return network === "Devnet" ? "0x" + Number(1440002).toString(16) : "0x" + Number(1449000).toString(16);
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
        displayedStatus = "Done";
        extraMessage = "Transaction completed successfully!";
        break;
      case "Failed":
      case "Timeout":
        displayedStatus = "Failed";
        extraMessage = "Transaction failed or timed out. Please try again.";
        break;
      default:
        displayedStatus = status || "Pending";
        break;
    }
    const evmTxUrl = destinationTxHash
      ? network === "Testnet"
        ? `https://explorer.testnet.xrplevm.org/tx/${destinationTxHash}`
        : `https://explorer.xrplevm.org/tx/${destinationTxHash}`
      : null;
    const bridgingTimeSec = bridgingTimeMs ? Math.floor(bridgingTimeMs / 1000) : 0;

    return (
      <AlertDialog open={showTxModal} onOpenChange={setShowTxModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction Status</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Current Status</span>
              <span
                className={`font-medium ${displayedStatus === "Pending" ? "animate-pulse" : ""} ${
                  displayedStatus === "Done" ? "text-green-500" : ""
                }`}
              >
                {displayedStatus}
              </span>
            </div>
            {extraMessage && <span className="text-sm text-gray-400">{extraMessage}</span>}

            {displayedStatus === "Pending" && <BridgingProgress />}

            {displayedStatus === "Done" && evmTxUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">XRPLEVM Tx Hash</span>
                <Link
                  href={evmTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline break-all hover:text-green-300"
                >
                  {destinationTxHash}
                </Link>
              </div>
            )}
            {bridgingTimeSec > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">Bridging Time</span>
                <span className="font-medium">{bridgingTimeSec} sec</span>
              </div>
            )}
            {displayedStatus === "Done" && (
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowTxModal(false)} className="hover:bg-gray-800">
                  Close
                </Button>
              </div>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-8">
        <div className="mb-8">
          <Logo className="w-56 h-12" />
        </div>
        <div className="flex flex-col items-center gap-3 mb-4 md:flex-row md:justify-center">
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

          <Select value={network} onValueChange={(value: string) => setNetwork(value as NetworkType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Devnet">Devnet</SelectItem>
              <SelectItem value="Testnet">Testnet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="evmAddress" className="font-semibold">
            Your Address
          </label>
          <Input
            id="evmAddress"
            type="text"
            value={evmAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvmAddress(e.target.value)}
            placeholder="0x5l8r9m..."
            disabled={isConnected}
            className={`rounded-md px-3 py-2 w-[300px] md:w-[459px] ${
              isConnected
                ? "border border-white/30 bg-[#2E2E2E] text-gray-200 cursor-not-allowed"
                : "border border-white/20 bg-background text-foreground focus:placeholder-transparent"
            }`}
          />
        </div>
        <p className="text-center font-medium mt-4">Before requesting, please complete the following:</p>
        <ul className="flex flex-col items-center gap-2 text-center">
          <li>
            <Link
              href="https://x.com/Peersyst"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSocialsCompleted({ ...socialsCompleted, twitter: true })}
              className="underline text-blue-400 hover:text-blue-300"
            >
              Follow @Peersyst on 𝕏
            </Link>{" "}
            {socialsCompleted.twitter && "✅"}
          </li>
          <li>
            <Link
              href="https://discord.com/invite/xrplevm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSocialsCompleted({ ...socialsCompleted, discord: true })}
              className="underline text-blue-400 hover:text-blue-300"
            >
              Join our Discord
            </Link>{" "}
            {socialsCompleted.discord && "✅"}
          </li>
        </ul>
        <Button
          variant="default"
          size="lg"
          className="mt-4"
          onClick={handleRequestXRP}
          disabled={!!txData || loading}
        >
          {loading ? `Waiting ~...` : "Request 90 XRP"}
        </Button>
      </section>

      {/* Transaction Status Modal */}
      {<TransactionStatusModal />}

      {/* Missing Requirements Modal */}
      {showMissingRequirementsModal && (
        <AlertDialog open={showMissingRequirementsModal} onOpenChange={setShowMissingRequirementsModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Almost there!</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="mb-4 text-center">
              Please make sure you follow us on 𝕏 and join our Discord 👾 before requesting test XRP.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowMissingRequirementsModal(false)}>
                Close
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Invalid Address Modal */}
      {showInvalidAddressModal && (
        <AlertDialog open={showInvalidAddressModal} onOpenChange={setShowInvalidAddressModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Invalid EVM Address</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="mb-4">
              Please enter a valid EVM address (starting with 0x).
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowInvalidAddressModal(false)}>
                Close
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
