export const useMintXrp = () => {
  return async function (destination: string): Promise<string> {
    console.log("[devnet-faucet] === starting mint request ===", { destination });

    const resp = await fetch("/api/devnet-faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: destination }),
    });

    let json: { txHash?: string; error?: string };
    try {
      json = await resp.json();
    } catch {
      throw new Error(`Faucet returned ${resp.status} with non-JSON body`);
    }

    if (!resp.ok || !json.txHash) {
      throw new Error(json.error ?? `Faucet returned ${resp.status}`);
    }

    console.log("[devnet-faucet] === mint done ===", { txHash: json.txHash });
    return json.txHash;
  };
};
