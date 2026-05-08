"use client";

import { useState, useEffect } from "react";
import { Faucet } from "@/components/faucet";
import { Footer } from "@/components/footer";

export default function Home() {
  const [network, setNetwork] = useState<"Testnet" | "Devnet">("Testnet");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen w-full" />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Faucet network={network} setNetwork={setNetwork} />
      <Footer />
    </div>
  );
}
