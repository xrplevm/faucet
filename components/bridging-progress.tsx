"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; // Assuming you're using lucide-react icons
import { cn } from "@/lib/utils";

const FACTS = [
  "XRP on XRPL has 1 million drops, on XRPLEVM it has 18 decimals.",
  "XRPLEVM Testnet chain id is 1449000.",
  "XRPLEVM Devnet chain id is 1440002.",
  "XRPL Testnet's chain id in Axelar is xrpl-test-1.",
  "XRPL Devnet's chain id in Axelar is xrpl-dev.",
  "XRPLEVM Testnet's chain id in Axelar is xrpl-evm-test-1.",
  "XRPLEVM Devnet's chain id in Axelar is xrpl-evm-devnet.",
  "All OpenZeppelin contracts can be used and deployed on the XRPLEVM.",
  "XRPLEVM's current EVM Version is Paris.",
  "XRPLEVM is a Cosmos-SDK blockchain with an EVM module by Evmos.",
  "XRPLEVM is fully interoperable with IBC.",
  "Smart contracts on XRPLEVM are developed using Solidity.",
  "Transactions on XRPLEVM finalize in under 4 seconds.",
  "The native currency for XRPLEVM transactions is XRP.",
  "Cross-chain communication is facilitated by the General Message Passing (GMP) protocol.",
  "Valid transactions on XRPLEVM require confirmation by XRPLEVM validators.",
  "Developers can deploy ERC20 tokens on the XRPLEVM with ease.",
  "The Axelar multisig account is essential for secure cross-chain asset transfers.",
  "Gas fees on XRPLEVM transactions are settled in XRP to minimize costs.",
  "Each smart contract on XRPLEVM can include customizable gas limits.",
  "Liquidity provision across chains enhances decentralized finance (DeFi) applications on XRPLEVM.",
  "Users can connect wallets like MetaMask to XRPLEVM via specified RPC URLs.",
  "Developers can utilize Remix, Truffle or Hardhat frameworks for smart contract testing.",
  "The XRPLEVM supports both fungible and non-fungible tokens (NFTs) natively.",
  "Developers can create DAOs using XRPLEVM's smart contract capabilities.",
  "XRPLEVM allows for contract upgrades utilizing a proxy pattern for seamless updates.",
  "Event logging is built into XRPLEVM, enabling tracking of contract executions.",
  "The EVM sidechain architecture is designed for optimal transaction throughput.",
  "Smart contracts on XRPLEVM can implement pausable functionality for emergency scenarios.",
  "The platform integrates seamlessly with Ethereum dApps with minimal configuration required.",
  "Each cross-chain operation utilizes ABI-encoded payloads for efficient communication.",
  "Gas consumption for transactions is automatically estimated based on current network load.",
  "XRPLEVM enables developers to leverage familiar JavaScript libraries and tools.",
  "Assets can be locked in contracts using escrow features unique to XRPLEVM.",
  "The XRPLEVM community actively maintains detailed documentation for developers.",
  "Cross-chain asset swaps are made possible using Axelar's secure infrastructure.",
  "Hyper-parameter tuning is possible to adjust performance metrics for smart contracts.",
  "MetaMask users can add XRPLEVM networks by inputting specific RPC URLs and chain ids.",
  "Developers can access a variety of APIs for fetching blockchain data easily.",
  "Token standards on XRPLEVM align with ERC20, supporting token transfers and minting.",
  "The Node CLI supports commands for querying network status and managing blockchain interactions.",
  "Operators can utilize Node sync options to optimize performance and maintain state.",
  "Validator security is paramount; nodes must conform to best practices for key management.",
  "Axelar's GMP payload ensures cross-chain operations retain integrity and security.",
  "Stablecoins can be minted and transferred over XRPLEVM, aligning with DeFi use cases.",
  "WETH and WBTC can be bridged to XRPL and XRPLEVM unlocking DeFi opportunities.",
  "Forks for successful EVM dApps can be deployed, ensuring compatibility with Ethereum smart contracts.",
  "Users can learn how to translate rAddress to 0x address format using dedicated tools and methods.",
  "Interacting with Cosmos IBC opens up new opportunities for cross-chain dApp functionality.",

  "XRPLEVM supports seamless integration with multiple wallet providers using standard JSON-RPC APIs.",
  "The EVM-compatible smart contracts on XRPLEVM utilize an ABI (Application Binary Interface) for function calls and events.",
  "Developers can utilize the testing framework found in Hardhat to simulate transactions on XRPLEVM before deploying to mainnet.",
  "XRPLEVM implements the ERC721 standard for NFTs, allowing minting, transferring, and querying of token metadata.",
  "Gas fees on XRPLEVM are dynamic and can fluctuate based on network congestion.",
  "The node's performance can be optimized via configuration variables, allowing developers to set memory limits and execution threads.",
  "XRPLEVM leverages Tendermint consensus for fast block finalization, aiming for interoperability within the Cosmos network.",
  "The `cosmovisor` tool helps in managing node upgrades with minimal downtime, ensuring over-the-air updates are handled seamlessly.",
  "Cosmos IBC allows XRPLEVM to send and receive assets from other IBC-enabled chains.",
  "Developers can configure public API endpoints to fetch real-time chain data.",
  "On XRPLEVM, the deployment of smart contracts can utilize proxy patterns for upgradeable contract logic without losing state.",
  "Cross-chain contract calls on the XRPLEVM require specific encoding of parameters to work across different blockchain ecosystems.",
  "The EVM module on XRPLEVM enables compatibility with existing Ethereum development tools, decreasing the learning curve for developers.",
  "CORS must be configured correctly in node settings for smooth integration between front-end apps and XRPLEVM backends.",
  "Developers can securely store private keys using native key management systems which integrate with common wallet standards.",
  "XRPLEVM allows for creating and managing liquidity pools, supporting both fungible and non-fungible token swaps.",
  "Custom resource limits can be set by validators, allowing tailored performance based on node capabilities and network demands.",
  "Users can manage their own nodes for increased control over token management and transaction verification.",
  "Multisignature wallets are supported, allowing multiple parties to control transactions, enhancing security, especially for DAOs.",
  "Developers can interact with XRPLEVM's rich event system to build reactive applications that respond to blockchain events.",
  "The Node CLI provides commands for deploying contracts, sending transactions, and checking the status of network nodes.",
  "Axelar’s generalized messaging framework enables developers to establish communication between contracts on different chains pragmatically.",
  "With XRPLEVM’s support for the Ethereum token standards, dApps can easily switch between ERC20 and XRPL token environments.",
  "Smart contracts on XRPLEVM can emit events that trigger off-chain listeners for integrations with traditional web applications.",
  "The XRPLEVM supports rate-limited API calls to protect against abuse and to ensure fair access to resources for all developers.",
  "Maintaining validator security includes implementing multi-factor authentication and regular audits of node configurations.",
  "XRPLEVM's bridge modules facilitate atomic swaps for cross-chain transactions that guarantee execution consistency across networks.",
  "The use of Solidity compiler plugins allows for easier optimization and debugging of smart contracts before deployment.",
  "Regions can be specified for node deployment in cloud infrastructure to reduce latency for users in different geographical locations.",
  "Telemetry data for node performance can be analyzed for patterns, helping maintain optimal operation and resource allocation.",
  "The Axelar network integrates seamlessly with XRPLEVM to offer cross-chain DeFi functionalities, including synthetic asset creation.",
  "XRPL EVM Explorer allows users to visualize transaction history and monitor on-chain activities in real-time.",
  "The XRPL EVM Governance Explorer is a dedicated tool for tracking proposals, votes, and governance activities within the XRPLEVM network.",
  "XRPL EVM Network RPC serves as the main endpoint for developers to connect applications to the XRPLEVM blockchain for transactions and data retrieval.",
  "The XRPL EVM Web Socket endpoint ensures real-time updates for applications, listening for events and changes in blockchain state.",
  "XRPL EVM Gnosis Safe is a user-friendly platform for managing assets with enhanced security features, supporting multi-signature transactions.",
  "The XRPLEVM Services Status page offers real-time monitoring of network health, including uptime and service disruptions.",
  "XRPL EVM documentation provides comprehensive guides and API references to assist new and experienced developers in building applications.",
  "The XRPL docs serve as a foundational resource for understanding the core functionalities of the XRPL blockchain and its features.",
  "Axelar JS SDK documentation provides developers with tools and libraries for facilitating cross-chain interactions using Axelar infrastructure."
  
];

export function BridgingProgress({ className }: { className?: string }) {
  const [showFact, setShowFact] = useState(false);
  const [currentFact, setCurrentFact] = useState<string>("");

  useEffect(() => {
    const toggleInterval = setInterval(() => {
      setShowFact((prev) => !prev); // Toggle between progress and fact
      if (!showFact) {
        const randomIndex = Math.floor(Math.random() * FACTS.length);
        setCurrentFact(FACTS[randomIndex]);
      }
    }, 10_000); // Switch every 10 seconds

    return () => clearInterval(toggleInterval);
  }, [showFact]);

  return (
    <div
      className={cn(
        "flex items-center justify-center flex-col gap-2 mt-4 min-h-[40px]",
        className
      )}
    >
      {!showFact ? (
        <div className="flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-green-500" />
          <span className="text-sm text-muted-foreground">
            Bridging in progress...
          </span>
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground animate-pulse italic max-w-[90%]">
          {currentFact}
        </div>
      )}
    </div>
  );
}

