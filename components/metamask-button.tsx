"use client";

import { MetaMaskInpageProvider } from "@metamask/providers";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ethereum?: MetaMaskInpageProvider;
  }
}

// ✅ Redirect URL for MetaMask install
const INSTALL_METAMASK_URL = "https://docs.xrplevm.org/pages/users/getting-started/install-metamask";

// ✅ Quick config references:
const TESTNET_CONFIG = {
  chainId: "0x" + Number(1449000).toString(16),
  chainName: "XRPL EVM Sidechain Testnet",
  nativeCurrency: {
    name: "XRP",
    symbol: "XRP",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.testnet.xrplevm.org/"],
  blockExplorerUrls: ["https://explorer.testnet.xrplevm.org"],
};

const DEVNET_CONFIG = {
  chainId: "0x" + Number(1449900).toString(16),
  chainName: "XRPL EVM Sidechain Devnet",
  nativeCurrency: {
    name: "XRP",
    symbol: "XRP",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.devnet.xrplevm.org/"],
  blockExplorerUrls: ["https://explorer.devnet.xrplevm.org"],
};

type NetworkType = "Testnet" | "Devnet";

const NETWORK_CONFIGS: Record<NetworkType, typeof TESTNET_CONFIG> = {
  Testnet: TESTNET_CONFIG,
  Devnet: DEVNET_CONFIG,
};

/**
 * ✅ Common logic for requesting a network add/switch in MetaMask
 * If MetaMask not installed, redirects to installation page.
 */
async function addNetworkToMetamask(network: NetworkType) {
  if (!window.ethereum) {
    window.open(INSTALL_METAMASK_URL, "_blank");
    return;
  }

  const selectedConfig = NETWORK_CONFIGS[network];

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [selectedConfig],
    });
  } catch (error) {
    console.error("Failed to add network:", error);
  }
}

/**
 * ✅ Regular full-labeled button
 */
export function MetamaskButton({
  className,
  network,
}: {
  className?: string;
  network: NetworkType;
}) {
  async function handleClick() {
    await addNetworkToMetamask(network);
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn("cursor-pointer gap-2", className)}
      size="lg"
    >
      <Icons.Metamask className="size-6" />
      <span className="font-bold">Add XRPL EVM Sidechain {network}</span>
    </Button>
  );
}

/**
 * ✅ Smaller icon-only button used in header, etc.
 */
export function MetamaskHeaderButton({
  className,
  network,
}: {
  className?: string;
  network: NetworkType;
}) {
  async function handleClick() {
    await addNetworkToMetamask(network);
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn("cursor-pointer gap-2 bg-white/[0.04] border-white/[0.08]", className)}
      size="lg"
    >
      <Icons.Metamask className="size-6" />
    </Button>
  );
}
