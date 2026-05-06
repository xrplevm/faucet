import { useState, useEffect } from "react";
import axios from "axios";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 300; // ~25 min

const AXELAR_API: Record<"Testnet", string> = {
  Testnet: "https://testnet.api.axelarscan.io/gmp/searchGMP",
};

const EVM_EXPLORER_API: Record<"Testnet", string> = {
  Testnet: "https://explorer.testnet.xrplevm.org/api/v2/addresses",
};

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const FAUCET_AMOUNT_XRP = 97.3;
const AMOUNT_TOLERANCE_XRP = 3;

interface AxelarRecord {
  status?: string;
  simplified_status?: string;
  message_id?: string;
  executed?: { transactionHash?: string; chain?: string };
  call?: { chain?: string; transactionHash?: string };
  interchain_transfer?: { rawDestinationAddress?: string; amount?: string };
  error?: unknown;
}

interface AxelarResponse {
  data: AxelarRecord[];
  total: number;
}

interface TokenTransferItem {
  to: { hash: string };
  total: { value: string; decimals: string | number };
  timestamp: string;
  transaction_hash: string;
}

const FINAL_SUCCESS_STATUSES = new Set(["received", "executed"]);
const FAILURE_STATUSES = new Set(["error", "failed", "insufficient_fee"]);

export function usePollDestinationTxStatus(
  destinationAddress: string,
  sourceCloseTimeIso: string,
  txHash: string,
  network: "Testnet" | "Devnet"
) {
  const [status, setStatus] = useState<"Pending" | "Arrived" | "Timeout" | "Failed">("Pending");
  const [destinationTxHash, setDestinationTxHash] = useState<string | null>(null);
  const [bridgingTimeMs, setBridgingTimeMs] = useState<number | null>(null);

  useEffect(() => {
    // Devnet has no bridge — the EVM tx IS the result, so nothing to poll.
    if (network !== "Testnet") return;
    if (!txHash) return;

    const startedAtMs = sourceCloseTimeIso ? new Date(sourceCloseTimeIso).getTime() : Date.now();
    let arrived = false;
    let attempts = 0;

    const markArrived = (destTx: string, source: "axelar" | "explorer") => {
      if (arrived) return;
      arrived = true;
      console.log(`[bridge-status] arrived (via ${source})`, { destTx });
      setDestinationTxHash(destTx);
      setBridgingTimeMs(Date.now() - startedAtMs);
      setStatus("Arrived");
    };

    // Primary signal: Axelar's GMP indexer.
    // Reports the bridge's own view of the transfer (called/approved/executing/executed).
    // Reliable when the indexer is healthy; misses transfers when the relayer is offline or lagged.
    const pollAxelar = async () => {
      if (arrived) return;
      try {
        const url = `${AXELAR_API.Testnet}?txHash=${txHash}`;
        const resp = await axios.get<AxelarResponse>(url);
        const records = resp.data?.data ?? [];
        console.log("[bridge-status][axelar] poll", { total: resp.data?.total, records: records.length });

        if (records.length === 0) return; // not indexed yet

        const evmLeg = records.find(
          (r) =>
            r.executed?.transactionHash?.startsWith("0x") &&
            (FINAL_SUCCESS_STATUSES.has(r.simplified_status ?? "") ||
              FINAL_SUCCESS_STATUSES.has(r.status ?? ""))
        );
        if (evmLeg?.executed?.transactionHash) {
          markArrived(evmLeg.executed.transactionHash, "axelar");
          return;
        }

        const errored = records.find(
          (r) =>
            FAILURE_STATUSES.has(r.simplified_status ?? "") ||
            FAILURE_STATUSES.has(r.status ?? "") ||
            r.error
        );
        if (errored && !arrived) {
          // Tentative failure — explorer fallback can still upgrade to Arrived later.
          console.error("[bridge-status][axelar] reports failure (tentative)", errored);
          setStatus("Failed");
        }
      } catch (err) {
        console.error("[bridge-status][axelar] query failed", err);
      }
    };

    // Fallback signal: scan the EVM explorer for a matching ERC-20 transfer to the user's address.
    // Independent of Axelar's indexer — finds the funds even if Axelar never indexes the message.
    // Less precise: matches by amount window + timestamp rather than by source-tx linkage.
    const pollExplorer = async () => {
      if (arrived) return;
      if (!destinationAddress || !sourceCloseTimeIso) return;
      try {
        const url =
          `${EVM_EXPLORER_API.Testnet}/${destinationAddress}/token-transfers` +
          `?type=ERC-20` +
          `&filter=${destinationAddress}%20|%200x0000000000000000000000000000000000000000` +
          `&token=${NATIVE_TOKEN_ADDRESS}`;
        const resp = await axios.get<{ items: TokenTransferItem[] }>(url);
        const items = resp.data?.items ?? [];
        console.log("[bridge-status][explorer] poll", { items: items.length });

        const sourceTimeMs = new Date(sourceCloseTimeIso).getTime();

        for (const item of items) {
          if (!item?.to?.hash) continue;
          if (item.to.hash.toLowerCase() !== destinationAddress.toLowerCase()) continue;

          const rawValueStr = item?.total?.value ?? "0";
          const decimals = parseInt(item?.total?.decimals.toString() ?? "18", 10);
          const floatVal = parseFloat(rawValueStr) / 10 ** decimals;
          if (Math.abs(floatVal - FAUCET_AMOUNT_XRP) > AMOUNT_TOLERANCE_XRP) continue;

          const evmTimeMs = new Date(item.timestamp).getTime();
          if (evmTimeMs <= sourceTimeMs) continue;

          markArrived(item.transaction_hash, "explorer");
          return;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return; // no transfers yet
        console.error("[bridge-status][explorer] query failed", err);
      }
    };

    const tick = () => {
      attempts++;
      if (attempts > MAX_POLL_ATTEMPTS) {
        if (!arrived) {
          console.warn("[bridge-status] both pollers timed out");
          setStatus("Timeout");
        }
        clearInterval(intervalId);
        return;
      }
      pollAxelar();
      pollExplorer();
    };

    tick();
    const intervalId = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [destinationAddress, sourceCloseTimeIso, txHash, network]);

  return { status, destinationTxHash, bridgingTimeMs };
}
