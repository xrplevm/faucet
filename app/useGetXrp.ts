import {Client, Payment, Wallet, xrpToDrops} from "xrpl";

const networks = {
    devnet: {
        faucet: "https://faucet.devnet.rippletest.net/accounts",
        bridgeGateway: "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC",
        bridgeNetwork: "xrpl-evm-devnet",
        wsUrl: "wss://s.devnet.rippletest.net:51233/"
    },
    testnet: {
        faucet: "https://faucet.altnet.rippletest.net/accounts",
        bridgeGateway: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
        bridgeNetwork: "xrpl-evm",
        wsUrl: "wss://s.altnet.rippletest.net:51233/"
    },
}

const reserve = 10;
const transferFee = 0.2;

export type Network = "devnet" | "testnet";

export const useGetXrp = (network: Network) => {
    return async function (destination: string) {
        const wallet = Wallet.generate();

        const resp = await fetch(networks[network].faucet, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination: wallet.address }),
        });

        const json = await resp.json();

        await new Promise((res) => setTimeout(res, 5000));

        const amount = json.amount - reserve - transferFee;

        console.log(wallet.address);

        const tx = prepareBridgeTransaction(wallet.address, network, destination, amount);

        console.log(tx);
        const client = new Client(networks[network].wsUrl);
        await client.connect();
        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        console.log(signed);
        const res = await client.submitAndWait(signed.tx_blob);
        console.log(res);
        return res.result.hash;
    }
}

const prepareBridgeTransaction = (originAddress: string, destinationNetwork: Network , destinationAddress: string, amount: number) => {
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
                MemoData: Buffer.from("1000000").toString("hex").toUpperCase(),
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
}