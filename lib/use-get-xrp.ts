import { Client, Payment, Wallet, xrpToDrops } from "xrpl";

const networks = {
  testnet: {
    faucet: "https://faucet.altnet.rippletest.net/accounts",
    bridgeGateway: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
    bridgeNetwork: "xrpl-evm",
    wsUrl: "wss://s.altnet.rippletest.net:51233/",
  },
};

const reserve = 1;

export type Network = "testnet";

export const useGetXrp = (network: Network) => {
  return async function (destination: string) {
    console.log("[faucet] === starting request ===", { network, destination });

    const wallet = Wallet.generate();
    console.log("[faucet] 1) generated ephemeral wallet", { address: wallet.address });

    console.log("[faucet] 2) POST to ripple faucet", networks[network].faucet);
    const resp = await fetch(networks[network].faucet, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: wallet.address }),
    });
    console.log("[faucet] 2) faucet HTTP status", resp.status, resp.statusText);

    const json = await resp.json();
    console.log("[faucet] 2) faucet response body", json);

    if (!resp.ok) {
      throw new Error(`Ripple faucet returned ${resp.status}: ${JSON.stringify(json)}`);
    }
    if (typeof json.amount !== "number") {
      throw new Error(`Ripple faucet response missing 'amount': ${JSON.stringify(json)}`);
    }

    console.log("[faucet] 3) waiting 1s for XRPL ledger to settle");
    await new Promise((res) => setTimeout(res, 1000));

    const amount = json.amount - reserve;
    const roundedAmount = Math.round(amount * 1e6) / 1e6;
    console.log("[faucet] 4) bridging amount (XRP)", { received: json.amount, reserve, sending: roundedAmount });

    const tx = prepareBridgeTransaction(wallet.address, network, destination, roundedAmount);
    console.log("[faucet] 5) prepared bridge tx", tx);

    console.log("[faucet] 6) connecting to XRPL", networks[network].wsUrl);
    const client = new Client(networks[network].wsUrl);
    await client.connect();
    console.log("[faucet] 6) connected");

    let prepared;
    try {
      prepared = await client.autofill(tx);
      // autofill defaults LastLedgerSequence to currentLedger + 20 (~60-80s).
      // Testnet can be slow enough that submitAndWait sees the window expire by 1-2 ledgers
      // even though the tx submitted with tesSUCCESS. Widen to ~5 minutes.
      prepared.LastLedgerSequence = (prepared.LastLedgerSequence ?? 0) + 75;
      console.log("[faucet] 7) autofilled tx (LLS extended)", prepared);
    } catch (err) {
      console.error("[faucet] 7) autofill FAILED — ephemeral account likely not yet on ledger", err);
      throw err;
    }

    const signed = wallet.sign(prepared);
    console.log("[faucet] 8) signed tx", { hash: signed.hash });

    let res;
    try {
      res = await client.submitAndWait(signed.tx_blob);
      console.log("[faucet] 9) submitAndWait result", res.result);
    } catch (err) {
      console.error("[faucet] 9) submitAndWait FAILED — bridge payment rejected", err);
      throw err;
    }

    const meta = res.result.meta;
    const engineResult = typeof meta === "object" && meta !== null && "TransactionResult" in meta ? meta.TransactionResult : undefined;
    if (engineResult && engineResult !== "tesSUCCESS") {
      console.warn("[faucet] 9) tx submitted but engine result is not tesSUCCESS:", engineResult);
    }

    console.log("[faucet] === done ===", { hash: res.result.hash });
    return res.result.hash;
  };
};

const prepareBridgeTransaction = (originAddress: string, destinationNetwork: Network, destinationAddress: string, amount: number) => {
  const memos = [
    {
      Memo: {
        MemoData: Buffer.from("interchain_transfer").toString("hex").toUpperCase(),
        MemoType: Buffer.from("type").toString("hex").toUpperCase(),
      },
    },
    {
      Memo: {
        MemoData: Buffer.from(destinationAddress.slice(2)).toString("hex").toUpperCase(),
        MemoType: Buffer.from("destination_address").toString("hex").toUpperCase(),
      },
    },
    {
      Memo: {
        MemoData: Buffer.from(networks[destinationNetwork].bridgeNetwork).toString("hex").toUpperCase(),
        MemoType: Buffer.from("destination_chain").toString("hex").toUpperCase(),
      },
    },
    {
      Memo: {
        MemoData: Buffer.from("1700000").toString("hex").toUpperCase(),
        MemoType: Buffer.from("gas_fee_amount").toString("hex").toUpperCase(),
      },
    },
  ];

  return {
    TransactionType: "Payment",
    Account: originAddress,
    Amount: xrpToDrops(amount),
    Destination: networks[destinationNetwork].bridgeGateway,
    Memos: memos,
  } as Payment;
};
