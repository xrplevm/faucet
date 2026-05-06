import { useState, useEffect } from "react";

const DEVNET_RPC = "https://rpc.devnet.xrplevm.org";
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 60; // ~2 min — XRPL EVM finalises in ~5s, so this is generous

interface RpcReceipt {
  status?: string;
  blockNumber?: string;
}

export type DevnetTxStatus = "Pending" | "Arrived" | "Failed" | "Timeout";

export function usePollDevnetTxStatus(txHash: string) {
  const [status, setStatus] = useState<DevnetTxStatus>("Pending");

  useEffect(() => {
    setStatus("Pending");
    if (!txHash) return;

    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      attempts++;
      if (attempts > MAX_POLL_ATTEMPTS) {
        console.warn("[devnet-status] timed out waiting for receipt", { txHash });
        setStatus("Timeout");
        if (intervalId) clearInterval(intervalId);
        return;
      }

      try {
        const resp = await fetch(DEVNET_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [txHash],
            id: 1,
          }),
        });
        const json: { result?: RpcReceipt | null } = await resp.json();
        const receipt = json.result;

        if (!receipt) return; // not mined yet

        if (receipt.status === "0x1") {
          console.log("[devnet-status] tx confirmed", { txHash });
          setStatus("Arrived");
          if (intervalId) clearInterval(intervalId);
        } else if (receipt.status === "0x0") {
          console.error("[devnet-status] tx reverted", { txHash });
          setStatus("Failed");
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error("[devnet-status] poll failed", err);
      }
    };

    tick();
    intervalId = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [txHash]);

  return { status };
}
