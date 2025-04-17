"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; // Assuming you're using lucide-react icons
import { cn } from "@/lib/utils";

const FACTS = [
  "XRP on XRPL has 1 million drops, on XRPL EVM it has 18 decimals.",
  "XRPL EVM Testnet chain id is 1449000.",
  "XRPL EVM Devnet chain id is 1440002.",
  "XRPL Testnet's chain id in Axelar is xrpl.",
  "XRPL Devnet's chain id in Axelar is xrpl-dev.",
  "XRPL EVM Testnet's chain id in Axelar is xrpl-evm.",
  "XRPL EVM Devnet's chain id in Axelar is xrpl-evm-devnet.",
  "All OpenZeppelin contracts can be used and deployed on the XRPL EVM.",
  "XRPL EVM's current EVM Version is Paris.",
  "XRPL EVM is a Cosmos-SDK blockchain with an EVM module by Evmos.",
  "XRPL EVM is fully interoperable with IBC.",
  "Smart contracts on XRPL EVM are developed using Solidity.",
  "Transactions on XRPL EVM finalize in under 4 seconds.",
  "The native currency for XRPL EVM transactions is XRP.",
  "Cross-chain communication is facilitated by the General Message Passing (GMP) protocol.",
  "Valid transactions on XRPL EVM require confirmation by XRPL EVM validators.",
  "Developers can deploy ERC20 tokens on the XRPL EVM with ease.",
  "The Axelar multisig account is essential for secure cross-chain asset transfers.",
  "Gas fees on XRPL EVM transactions are settled in XRP to minimize costs.",
  "Each smart contract on XRPL EVM can include customizable gas limits.",
  "Liquidity provision across chains enhances decentralized finance (DeFi) applications on XRPL EVM.",
  "Users can connect wallets like MetaMask to XRPL EVM via specified RPC URLs.",
  "Developers can utilize Remix, Truffle or Hardhat frameworks for smart contract testing.",
  "The XRPL EVM supports both fungible and non-fungible tokens (NFTs) natively.",
  "Developers can create DAOs using XRPL EVM's smart contract capabilities.",
  "XRPL EVM allows for contract upgrades utilizing a proxy pattern for seamless updates.",
  "Event logging is built into XRPL EVM, enabling tracking of contract executions.",
  "The EVM sidechain architecture is designed for optimal transaction throughput.",
  "Smart contracts on XRPL EVM can implement pausable functionality for emergency scenarios.",
  "The platform integrates seamlessly with Ethereum dApps with minimal configuration required.",
  "Each cross-chain operation utilizes ABI-encoded payloads for efficient communication.",
  "Gas consumption for transactions is automatically estimated based on current network load.",
  "XRPL EVM enables developers to leverage familiar JavaScript libraries and tools.",
  "Assets can be locked in contracts using escrow features unique to XRPL EVM.",
  "The XRPLEVM community actively maintains detailed documentation for developers.",
  "Cross-chain asset swaps are made possible using Axelar's secure infrastructure.",
  "Hyper-parameter tuning is possible to adjust performance metrics for smart contracts.",
  "MetaMask users can add XRPLEVM networks by inputting specific RPC URLs and chain ids.",
  "Developers can access a variety of APIs for fetching blockchain data easily.",
  "Token standards on XRPL EVM align with ERC20, supporting token transfers and minting.",
  "The Node CLI supports commands for querying network status and managing blockchain interactions.",
  "Operators can utilize Node sync options to optimize performance and maintain state.",
  "Validator security is paramount; nodes must conform to best practices for key management.",
  "Axelar's GMP payload ensures cross-chain operations retain integrity and security.",
  "Stablecoins can be minted and transferred over XRPL EVM, aligning with DeFi use cases.",
  "WETH and WBTC can be bridged to XRPL and XRPL EVM unlocking DeFi opportunities.",
  "Forks for successful EVM dApps can be deployed, ensuring compatibility with Ethereum smart contracts.",
  "Users can learn how to translate rAddress to 0x address format using dedicated tools and methods.",
  "Interacting with Cosmos IBC opens up new opportunities for cross-chain dApp functionality.",
  "XRPL EVM supports seamless integration with multiple wallet providers using standard JSON-RPC APIs.",
  "The EVM-compatible smart contracts on XRPL EVM utilize an ABI (Application Binary Interface) for function calls and events.",
  "Developers can utilize the testing framework found in Hardhat to simulate transactions on XRPL EVM before deploying to mainnet.",
  "XRPLEVM implements the ERC721 standard for NFTs, allowing minting, transferring, and querying of token metadata.",
  "Gas fees on XRPL EVM are dynamic and can fluctuate based on network congestion.",
  "The node's performance can be optimized via configuration variables, allowing developers to set memory limits and execution threads.",
  "XRPL EVM leverages Tendermint consensus for fast block finalization, aiming for interoperability within the Cosmos network.",
  "The `cosmovisor` tool helps in managing node upgrades with minimal downtime, ensuring over-the-air updates are handled seamlessly.",
  "Cosmos IBC allows XRPL EVM to send and receive assets from other IBC-enabled chains.",
  "Developers can configure public API endpoints to fetch real-time chain data.",
  "On XRPL EVM, the deployment of smart contracts can utilize proxy patterns for upgradeable contract logic without losing state.",
  "Cross-chain contract calls on the XRPL EVM require specific encoding of parameters to work across different blockchain ecosystems.",
  "The EVM module on XRPL EVM enables compatibility with existing Ethereum development tools, decreasing the learning curve for developers.",
  "CORS must be configured correctly in node settings for smooth integration between front-end apps and XRPL EVM backends.",
  "Developers can securely store private keys using native key management systems which integrate with common wallet standards.",
  "XRPL EVM allows for creating and managing liquidity pools, supporting both fungible and non-fungible token swaps.",
  "Custom resource limits can be set by validators, allowing tailored performance based on node capabilities and network demands.",
  "Users can manage their own nodes for increased control over token management and transaction verification.",
  "Multisignature wallets are supported, allowing multiple parties to control transactions, enhancing security, especially for DAOs.",
  "Developers can interact with XRPL EVM's rich event system to build reactive applications that respond to blockchain events.",
  "The Node CLI provides commands for deploying contracts, sending transactions, and checking the status of network nodes.",
  "Axelar’s generalized messaging framework enables developers to establish communication between contracts on different chains pragmatically.",
  "With XRPL EVM’s support for the Ethereum token standards, dApps can easily switch between ERC20 and XRPL token environments.",
  "Smart contracts on XRPL EVM can emit events that trigger off-chain listeners for integrations with traditional web applications.",
  "The XRPL EVM supports rate-limited API calls to protect against abuse and to ensure fair access to resources for all developers.",
  "Maintaining validator security includes implementing multi-factor authentication and regular audits of node configurations.",
  "XRPL EVM's bridge modules facilitate atomic swaps for cross-chain transactions that guarantee execution consistency across networks.",
  "The use of Solidity compiler plugins allows for easier optimization and debugging of smart contracts before deployment.",
  "Regions can be specified for node deployment in cloud infrastructure to reduce latency for users in different geographical locations.",
  "Telemetry data for node performance can be analyzed for patterns, helping maintain optimal operation and resource allocation.",
  "The Axelar network integrates seamlessly with XRPL EVM to offer cross-chain DeFi functionalities, including synthetic asset creation.",
  "XRPL EVM Explorer allows users to visualize transaction history and monitor on-chain activities in real-time.",
  "The XRPL EVM Governance Explorer is a dedicated tool for tracking proposals, votes, and governance activities within the XRPL EVM network.",
  "XRPL EVM Network RPC serves as the main endpoint for developers to connect applications to the XRPL EVM blockchain for transactions and data retrieval.",
  "The XRPL EVM Web Socket endpoint ensures real-time updates for applications, listening for events and changes in blockchain state.",
  "XRPL EVM Gnosis Safe is a user-friendly platform for managing assets with enhanced security features, supporting multi-signature transactions.",
  "The XRPL EVM Services Status page offers real-time monitoring of network health, including uptime and service disruptions.",
  "XRPL EVM documentation provides comprehensive guides and API references to assist new and experienced developers in building applications.",
  "The XRPL docs serve as a foundational resource for understanding the core functionalities of the XRPL blockchain and its features.",
  "Axelar JS SDK documentation provides developers with tools and libraries for facilitating cross-chain interactions using Axelar infrastructure.",
];

export function BridgingProgress({ className }: { className?: string }) {
  const [currentFact, setCurrentFact] = useState<string>("");

  useEffect(() => {
    const toggleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * FACTS.length);
      setCurrentFact(FACTS[randomIndex]);
    }, 8_000); // Switch every 8 seconds

    return () => clearInterval(toggleInterval);
  }, []);

  return (
    <div className={cn("flex items-center justify-center flex-col gap-2 mt-4 min-h-[40px]", className)}>
      <div className="flex items-center gap-2 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-green-500" />
        <span className="text-sm text-muted-foreground">Bridging in progress...</span>
      </div>
      <div className="text-center text-sm text-muted-foreground animate-pulse italic max-w-[90%]">{currentFact}</div>
    </div>
  );
}
