"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import { InstallMetamaskModal } from "./install-metamask-modal"; 
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

declare global {
  interface Window {
    ethereum?: {
      // Minimal shape for EIP-1193 requests & events
      request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
      on(eventName: string, listener: (...args: unknown[]) => void): void;
      removeListener(eventName: string, listener: (...args: unknown[]) => void): void;
      isMetaMask?: boolean;
    };
  }
}

interface ConnectWalletButtonProps {
  className?: string;
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
}

export function ConnectWalletButton({ className, onConnected, onDisconnected }: ConnectWalletButtonProps) {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [, setIsReturningUser] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Detect if user is on a mobile browser (e.g. Safari/Chrome on iOS/Android)
  const isMobileBrowser =
    typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  // 1) Dynamically detect MetaMask
  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined" && window.ethereum) {
      setHasMetaMask(true);
    }

    function handleEthereumInitialized() {
      setHasMetaMask(true);
    }
    window.addEventListener("ethereum#initialized", handleEthereumInitialized, { once: true });

    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.ethereum) {
        setHasMetaMask(true);
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      window.removeEventListener("ethereum#initialized", handleEthereumInitialized);
      clearInterval(interval);
    };
  }, []);

  // 2) On mount, check for existing accounts & subscribe to events
  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem("isReturningUser");
    if (stored === null) setIsReturningUser(false);
    else setIsReturningUser(stored === "true");

    if (!window.ethereum) return;

    window.ethereum.request<string[]>({ method: "eth_accounts" }).then((accounts) => {
      if (accounts && accounts.length > 0) {
        setConnectedAccount(accounts[0]);
        onConnected?.(accounts[0]);
      }
    });

    const handleAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts)) {
        console.warn("Unexpected 'accounts' param:", accounts);
        return;
      }
      if (accounts.length === 0) {
        setConnectedAccount(null);
        onDisconnected?.();
        localStorage.setItem("isReturningUser", "false");
      } else {
        setConnectedAccount(accounts[0]);
        onConnected?.(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [onConnected, onDisconnected]);

  // 3) Connect wallet
  async function connectWallet() {
    if (!window.ethereum) {
      setShowInstallModal(true);
      return;
    }

    try {
      const accounts = await window.ethereum.request<string[]>({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setConnectedAccount(accounts[0]);
        onConnected?.(accounts[0]);
        setIsReturningUser(true);
        localStorage.setItem("isReturningUser", "true");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }

  // 4) Disconnect wallet
  async function handleDisconnect() {
    // Clear local state regardless
    setConnectedAccount(null);
    onDisconnected?.();
    onConnected?.("");
    setIsReturningUser(false);
    localStorage.setItem("isReturningUser", "false");

    if (window.ethereum) {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent || "");
      if (isMobile) {
        try {
          // Instead of revoking permissions (which doesn't work on mobile),
          // we fetch current permissions and instruct the user.
          const permissions = await window.ethereum.request({
            method: "wallet_getPermissions",
            params: [],
          });
          console.log("Current wallet permissions:", permissions);
          alert(
            "MetaMask Mobile does not support automatic disconnect. Manage permissions on the top right corner and click on 'disconnect all' to fully disconnect."
          );
        } catch (err) {
          console.warn("Error getting wallet permissions on mobile:", err);
        }
      } else {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (error) {
          console.error("Error revoking permissions on desktop:", error);
        }
      }
    } else {
      console.warn("Ethereum provider is not available.");
    }
  }

  if (!mounted) return null;

  // ------------------
  // RENDER LOGIC:
  // ------------------

  // If user is connected
  if (connectedAccount) {
    const shortAddr = `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className={cn("gap-2 bg-white/[0.04] border-white/[0.08]", className)}>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-semibold">{shortAddr}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2">
          <button className="w-full text-left px-2 py-1 hover:bg-white/10 rounded-md" onClick={handleDisconnect}>
            Disconnect
          </button>
        </PopoverContent>
      </Popover>
    );
  }

  // If user DOES have an injected provider (MetaMask in-app or desktop)
  if (hasMetaMask) {
    return (
      <Button
        onClick={connectWallet}
        variant="outline"
        size="lg"
        className={cn("cursor-pointer gap-2 bg-white/[0.04] border-white/[0.08]", className)}
      >
        <Icons.Metamask className="size-6" />
        <span className="font-semibold">Connect Wallet</span>
      </Button>
    );
  }

  // If NO injected provider => Distinguish mobile vs. desktop
  if (isMobileBrowser) {
    function handleMobileDeepLink() {
      const currentUrl = window.location.href.replace(/^https?:\/\//, "");
      window.location.href = `https://metamask.app.link/dapp/${currentUrl}`;
    }

    return (
      <Button
        variant="outline"
        size="lg"
        className={cn("cursor-pointer gap-2 bg-white/[0.04] border-white/[0.08]", className)}
        onClick={handleMobileDeepLink}
      >
        <Icons.Metamask className="size-6" />
        <span className="font-semibold">Connect Wallet</span>
      </Button>
    );
  }

  // Desktop user with no MetaMask => show "Install MetaMask" button
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={cn("cursor-pointer gap-2 bg-white/[0.04] border-white/[0.08]", className)}
        onClick={() => setShowInstallModal(true)}
      >
        <Icons.Metamask className="size-6" />
        <span className="font-semibold">Install MetaMask</span>
      </Button>
      <InstallMetamaskModal open={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
}
