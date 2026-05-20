"use client";

import { useState } from "react";
import { Faucet } from "@/components/faucet";
import { Footer } from "@/components/footer";

export default function Home() {
  const [network, setNetwork] = useState<"Testnet" | "Devnet">("Testnet");

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <Faucet network={network} setNetwork={setNetwork} />
      <Footer />
    </div>
  );
}
