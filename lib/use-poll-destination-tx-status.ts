import { useState, useEffect } from "react";
import axios from "axios";

// Define a type for a token transfer item:
interface TokenTransferItem {
  to: { hash: string };
  total: { value: string; decimals: string | number };
  timestamp: string;
  transaction_hash: string;
}

const DEST_POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 300; // maximum attempts

/**
 * Custom hook that polls the destination chain for the faucet transaction.
 *
 * @param destinationAddress - The user's 0x address receiving funds.
 * @param sourceCloseTimeIso - The close_time_iso from the XRPL transaction.
 * @param txHash - The original XRPL transaction hash.
 * @param network - Either "Devnet" or "Testnet".
 *
 * @returns An object with:
 *  - status: "Pending", "Arrived", "Timeout", or "Failed"
 *  - destinationTxHash: the destination chain transaction hash (if arrived)
 *  - bridgingTimeMs: the difference between source close time and the destination tx time (if available)
 */
export function usePollDestinationTxStatus(
  destinationAddress: string,
  sourceCloseTimeIso: string,
  txHash: string,
  network: "Devnet" | "Testnet"
) {
  const [status, setStatus] = useState<"Pending" | "Arrived" | "Timeout" | "Failed">("Pending");
  const [destinationTxHash, setDestinationTxHash] = useState<string | null>(null);
  const [bridgingTimeMs, setBridgingTimeMs] = useState<number | null>(null);

  useEffect(() => {
    if (!destinationAddress || !sourceCloseTimeIso || !txHash) return;

    let attempts = 0;
    const faucetAmount = 89.50589; // expected faucet amount

    const poll = async () => {
      attempts++;

      try {
        // 1) Construct the explorer API URL based on network.
        let explorerBaseUrl: string;
        let tokenAddress: string;
        if (network === "Devnet") {
          explorerBaseUrl = "https://explorer.xrplevm.org/api/v2/addresses";
          tokenAddress = "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517";
        } else {
          explorerBaseUrl = "https://explorer.testnet.xrplevm.org/api/v2/addresses";
          tokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        }
        const url =
          `${explorerBaseUrl}/${destinationAddress}/token-transfers` +
          `?type=ERC-20` +
          `&filter=${destinationAddress}%20|%200x0000000000000000000000000000000000000000` +
          `&token=${tokenAddress}`;

        // 2) Fetch transfers data.
        let items: TokenTransferItem[] = [];
        try {
          const resp = await axios.get(url);
          items = resp.data.items as TokenTransferItem[];
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
              // No transfers found yet, continue polling
            } else {
              setStatus("Failed");
            }
          } else {
            setStatus("Failed");
          }
        }

        // 3) Find a matching transfer:
        for (const item of items) {
          if (!item?.to?.hash) continue;
          if (item.to.hash.toLowerCase() !== destinationAddress.toLowerCase()) continue;

          // Compare amounts
          const rawValueStr = item?.total?.value ?? "0";
          const decimals = parseInt(item?.total?.decimals.toString() ?? "18", 10);
          const floatVal = parseFloat(rawValueStr) / 10 ** decimals;

          // Allow for a small difference in amount due to fees (within 3 XRP)
          if (Math.abs(floatVal - faucetAmount) > 3) continue;

          // Compare timestamps (only consider transfers after XRPL close time)
          const evmTimestampIso = item.timestamp;
          const evmTimeMs = new Date(evmTimestampIso).getTime();
          const sourceTimeMs = new Date(sourceCloseTimeIso).getTime();

          if (evmTimeMs <= sourceTimeMs) continue;

          // Match found!
          const bridgingTime = evmTimeMs - sourceTimeMs;
          setStatus("Arrived");
          setDestinationTxHash(item.transaction_hash);
          setBridgingTimeMs(bridgingTime);
          return;
        }
      } catch {
        setStatus("Failed");
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setStatus("Timeout");
      }
    };

    const intervalId = setInterval(poll, DEST_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [destinationAddress, sourceCloseTimeIso, txHash, network]);

  return { status, destinationTxHash, bridgingTimeMs };
}
