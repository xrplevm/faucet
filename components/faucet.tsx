"use client";

import React, { useState, useEffect, JSX } from "react";
import { io, Socket } from "socket.io-client";
import { MetamaskButton } from "./metamask-button"; // Must use this
import { ConnectWalletButton } from "./connect-wallet-button";
import { Button } from "./ui/button";
import { BridgingProgress } from "./bridging-progress";
import { Logo } from "@/components/logo";
import {useGetXrp} from "@/app/useGetXrp";

/**
 * The network type used throughout.
 */
export type NetworkType = "Devnet" | "Testnet";

/**
 * Transaction status for bridging/faucet tracking.
 */
interface TxStatus {
  id: string;
  status?: string;
  bridgingTimeMs?: number;
  destinationTxHash?: string;
}

/**
 * Emitted when a new transaction is created on the backend.
 */
interface TransactionCreatedEvent {
  result: {
    id: string;
    status: string;
    // Add other fields if needed
  };
}

/**
 * Emitted when a transaction is updated (polled, bridging done, etc.).
 */
interface TransactionUpdatedEvent {
  id: string;
  status?: string;
  bridgingTimeMs?: number;
  destinationTxHash?: string;
}

/**
 * Props for our main Faucet component.
 */
interface FaucetProps {
  network: NetworkType;
  setNetwork: React.Dispatch<React.SetStateAction<NetworkType>>;
  evmAddressFromHeader?: string;
}

/**
 * Hardcode chain IDs that your metamask-button uses.
 */
const XRPL_DEVNET_CHAINID = "0x" + Number(1440002).toString(16);
const XRPL_TESTNET_CHAINID = "0x" + Number(1449000).toString(16);

/** Return chainId string for the chosen network. */
function getDesiredChainId(network: NetworkType): string {
  return network === "Devnet" ? XRPL_DEVNET_CHAINID : XRPL_TESTNET_CHAINID;
}

export function Faucet({
  network,
  setNetwork,
  evmAddressFromHeader,
}: FaucetProps): JSX.Element {
  /**
   * "evmAddress": the typed address the user can fill in (or overwritten by connected address).
   */
  const [evmAddress, setEvmAddress] = useState<string>(evmAddressFromHeader || "");

  /**
   * "connectedAddress": the actual wallet address from ConnectWalletButton
   * used to show the green circle + short address.
   */
  const [connectedAddress, setConnectedAddress] = useState<string>("");

  // Tracking the user's progress on required steps
  const [followedTwitter, setFollowedTwitter] = useState<boolean>(false);
  const [joinedDiscord, setJoinedDiscord] = useState<boolean>(false);

  // Faucet request state
  const [loading, setLoading] = useState<boolean>(false);
  const [waitTime, setWaitTime] = useState<number>(0);

  // Connect/Disconnect dropdown
  const [showDisconnectMenu, setShowDisconnectMenu] = useState<boolean>(false);

  // The chain ID from the wallet (if any)
  const [chainId, setChainId] = useState<string | null>(null);

  // Socket.io for transaction updates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTx, setActiveTx] = useState<TxStatus | null>(null);

  // Missing Requirements modal
  const [showMissingRequirementsModal, setShowMissingRequirementsModal] = useState<boolean>(false);

  /**
   * Sync evmAddressFromHeader to local state if changed.
   */
  useEffect(() => {
    if (evmAddressFromHeader) {
      setEvmAddress(evmAddressFromHeader);
    } else {
      setEvmAddress("");
    }
  }, [evmAddressFromHeader]);

  /**
   * Connect to Socket.IO on mount, listen for transaction events.
   */
  useEffect(() => {
    const newSocket: Socket = io("http://localhost:5005");
    setSocket(newSocket);

    // Listen for new TX creation
    newSocket.on("transactionCreated", (data: TransactionCreatedEvent) => {
      setActiveTx({
        id: data.result.id,
        status: data.result.status,
      });
    });

    // Listen for TX updates
    newSocket.on("transactionUpdated", (data: TransactionUpdatedEvent) => {
      if (data.id === activeTx?.id) {
        setActiveTx((prev) => {
          if (!prev) return null;
          let newStatus = prev.status;
          // If bridging is completed
          if (data.destinationTxHash && data.bridgingTimeMs) {
            newStatus = "Arrived";
          }
          return {
            ...prev,
            status: newStatus,
            bridgingTimeMs: data.bridgingTimeMs ?? prev.bridgingTimeMs,
            destinationTxHash: data.destinationTxHash ?? prev.destinationTxHash,
          };
        });
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [activeTx?.id]);

  /**
   * Safely check for MetaMask to avoid SSR errors
   */
  const hasMetaMask: boolean =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof window !== "undefined" && !!(window as any).ethereum;

  /**
   * On mount / chain changes, read chainId if possible.
   */
  useEffect(() => {
    async function fetchChainId() {
      if (hasMetaMask) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cid = await (window as any).ethereum.request({
            method: "eth_chainId",
          });
          setChainId(cid as string);
        } catch (err) {
          console.error("Failed to get chainId:", err);
        }
      }
    }
    fetchChainId();

    if (hasMetaMask) {
      const handleChainChanged = (chain: string) => {
        setChainId(chain);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [hasMetaMask, connectedAddress]);

  /**
   * Disconnect flow
   */
  const handleDisconnect = async (): Promise<void> => {
    setShowDisconnectMenu(false);
    // Clear the connected address
    setConnectedAddress("");

    if (hasMetaMask) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
    }
  };

  /**
   * The main faucet request
   */
  const handleRequestXRP = async (): Promise<void> => {
    if (!followedTwitter || !joinedDiscord) {
      setShowMissingRequirementsModal(true);
      return;
    }
    // Use the typed "evmAddress" for the faucet request
    if (!evmAddress.startsWith("0x") || evmAddress.length < 10) {
      alert("Please enter a valid EVM address (starting with 0x).");
      return;
    }
    setLoading(true);
    setWaitTime(10);

    try {
      const resp = await fetch("http://localhost:5005/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, evmAddress }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Faucet failed");
      }
      console.log("Faucet TX started. XRPL Hash:", data.txHash);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        alert("Error requesting faucet: " + error.message);
      } else {
        alert("Error requesting faucet: " + String(error));
      }
    } finally {
      setLoading(false);
      setWaitTime(0);
    }
  };

  // Check if user is on the desired chain
  const desiredChainId: string = getDesiredChainId(network);
  const isOnDesiredChain: boolean =
    !!chainId && chainId.toLowerCase() === desiredChainId.toLowerCase();

  // We consider "connected" if connectedAddress is not empty
  const isConnected = connectedAddress !== "";

  // shortConnected for the green circle display
  const shortConnected: string =
    connectedAddress.length > 10
      ? `${connectedAddress.slice(0, 5)}...${connectedAddress.slice(-3)}`
      : connectedAddress;

  /**
   * Renders bridging/faucet transaction status
   */
  function TransactionStatusModal(): JSX.Element | null {
    if (!activeTx) return null;
  
    // We'll map your existing statuses to the new display statuses.
    let displayedStatus = "";
    let extraMessage = "";
  
    switch (activeTx.status) {
      case "Executed":
        // Show "Pending" + ETA ~2 minutes
        displayedStatus = "Pending";
        extraMessage = "Estimated time: ~2 minutes";
        break;
      case "Arrived":
        // Once EVM transaction arrives => "Completed"
        displayedStatus = "Completed";
        break;
      case "Failed":
      case "Timeout":
        displayedStatus = "Failed";
        break;
      default:
        // e.g. "Bridging" or any other in-progress statuses
        displayedStatus = activeTx.status || "Pending";
        break;
    }
  
    // Show bridging spinner if still "Pending" (or your other in-progress states).
    const isBridging =
      displayedStatus === "Pending" ||
      displayedStatus === "Bridging";
  
    // EVM transaction link, if we have it
    let evmTxUrl: string | null = null;
    if (activeTx.destinationTxHash) {
      evmTxUrl =
        network === "Testnet"
          ? `https://explorer.testnet.xrplevm.org/tx/${activeTx.destinationTxHash}`
          : `https://explorer.xrplevm.org/tx/${activeTx.destinationTxHash}`;
    }
  
    // Bridging time (if your code sets bridgingTimeMs)
    const bridgingTimeSec = activeTx.bridgingTimeMs
      ? Math.floor(activeTx.bridgingTimeMs / 1000)
      : 0;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#1E1E1E] w-[500px] max-w-[90%] p-6 rounded-xl shadow-xl relative text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Transaction Status
          </h2>
  
          <div className="space-y-4">
            {/* 
              1) XRPL Tx ID block removed
              2) Displayed status is "Pending" or "Completed"
            */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Current Status</span>
              <span
                className={`font-medium ${
                  displayedStatus === "Pending" ? "animate-pulse" : ""
                }`}
              >
                {displayedStatus}
              </span>
              {extraMessage && (
                <span className="text-sm text-gray-400">{extraMessage}</span>
              )}
            </div>
  
            {/* If bridging is in progress, show your bridging spinner/facts */}
            {isBridging && <BridgingProgress />}
  
            {/* 
              3) Once EVM tx arrives => "Completed" 
                 We show only the XRPLEVM Tx Hash
            */}
            {displayedStatus === "Completed" && evmTxUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">XRPLEVM Tx Hash</span>
                <a
                  href={evmTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline break-all hover:text-green-300"
                >
                  {activeTx.destinationTxHash}
                </a>
              </div>
            )}
  
            {/* If bridging time is recorded, still show it */}
            {bridgingTimeSec > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">Bridging time</span>
                <span className="font-medium">{bridgingTimeSec} sec</span>
              </div>
            )}
          </div>
  
          <button
            className="mt-8 w-full py-3 rounded-md bg-green-600 hover:bg-green-500 font-semibold text-white"
            onClick={() => setActiveTx(null)}
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  

  /**
   * Renders the "Missing Requirements" modal for Follow Twitter / Join Discord
   */
  function MissingRequirementsModal(): JSX.Element | null {
    if (!showMissingRequirementsModal) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
        <div className="bg-white rounded-md p-6 w-[500px] text-black">
          <h2 className="text-xl font-bold mb-4">Almost there!</h2>
          <p className="mb-4">
            Please make sure you follow us on 𝕏 and join our Discord 👾 before requesting test XRP.
          </p>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md"
            onClick={() => setShowMissingRequirementsModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /**
   * If user is connected => disable the text field
   * We'll use a "sleek" background color for read-only style
   */
  const addressInputClass = isConnected
    ? "border border-white/30 bg-[#2E2E2E] text-gray-200 cursor-not-allowed"
    : "border border-white/20 bg-background text-foreground focus:placeholder-transparent";

  const getXrp = useGetXrp(network.toLowerCase() as any);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-5 px-4 py-8">
        {/* Logo (scaled 3x) */}
        <div
          className="mb-8"
          style={{ transform: "scale(3)", transformOrigin: "center" }}
        >
          <Logo />
        </div>

        {/* Row: left = connect/disconnect square; right = add network */}
        <div className="mb-4 flex items-center gap-3">
          {/* Left: connect or connected address */}
          {!isConnected ? (
            // Square connect wallet button
            <ConnectWalletButton
              onConnected={(addr) => {
                // On connect => set both connectedAddress & evmAddress
                setConnectedAddress(addr);
                setEvmAddress(addr);
              }}
            />
          ) : (
            <div className="relative inline-block">
              <button
                onClick={() => setShowDisconnectMenu(!showDisconnectMenu)}
                className="h-10 px-4 flex items-center gap-2 border border-white/10 bg-white/5 rounded-md hover:bg-white/10"
              >
                {/* Green circle */}
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {/* shortConnected for display */}
                <span className="text-sm text-white">{shortConnected}</span>
              </button>

              {/* Disconnect dropdown */}
              {showDisconnectMenu && (
                <div className="absolute top-full left-0 mt-2 w-[140px] bg-[#1E1E1E] border border-white/10 rounded-md shadow-lg p-2 z-50">
                  <button
                    className="w-full text-left px-2 py-1 hover:bg-white/10 rounded-md text-white"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Right: MetamaskButton or "No Wallet" or "Network Added" */}
          {!hasMetaMask ? (
            <Button variant="outline" className="h-10" disabled>
              No Wallet
            </Button>
          ) : isOnDesiredChain ? (
            <Button variant="outline" className="h-10" disabled>
              Network Added
            </Button>
          ) : (
            // If not on chain => normal metamask button
            <MetamaskButton className="h-10" network={network} />
          )}
        </div>

        {/* Network Selector */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="network" className="font-semibold">
            Select Network
          </label>
          <select
            id="network"
            className="border rounded-md px-3 py-2 bg-background text-foreground"
            value={network}
            onChange={(e) => setNetwork(e.target.value as NetworkType)}
          >
            <option value="Devnet">Devnet</option>
            <option value="Testnet">Testnet</option>
          </select>
        </div>

        {/* EVM Address input */}
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="evmAddress" className="font-semibold">
            Your Address
          </label>
          <input
            id="evmAddress"
            type="text"
            value={evmAddress}
            onChange={(e) => setEvmAddress(e.target.value)}
            placeholder="0x5l8r9m..."
            disabled={isConnected}
            className={`rounded-md px-3 py-2 w-[459px] ${addressInputClass}`}
          />
        </div>

        {/* Required steps funnel */}
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

        {/* Request XRP button */}
        <Button
          variant="default"
          size="lg"
          className="mt-4"
          onClick={() => getXrp(evmAddress)}
          disabled={loading}
        >
          {loading ? `Waiting ~${waitTime}s...` : "Request 90 XRP"}
        </Button>
      </section>

      {/* Transaction modals */}
      <TransactionStatusModal />
      <MissingRequirementsModal />
    </>
  );
}
