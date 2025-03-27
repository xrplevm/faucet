"use client";

import { useState, useEffect } from "react";
import { Faucet } from "@/components/faucet";
import { Footer } from "@/components/footer";

export default function Home() {
  const [network, setNetwork] = useState<"Devnet" | "Testnet">("Testnet");

  // We’ll track if we are mounted so SSR doesn’t mismatch client logic
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This runs only on the client
    setIsMounted(true);
  }, []);

  // On the server (SSR), isMounted = false => we show minimal placeholder
  // so the client & server match. On the client, we do the real rendering.
  if (!isMounted) {
    // Return a small stable placeholder to avoid mismatch
    return (
      <main className="flex flex-col min-h-screen w-full">
        {/* Basic placeholder or nothing */}
        <div className="flex-grow flex items-center justify-center">
          {/* Or a spinner if you like */}
        </div>
        <Footer network={network} />
      </main>
    );
  }

  // Once mounted, do your normal rendering
  return (
    <main className="flex flex-col min-h-screen w-full">
      <div className="flex-grow flex items-center justify-center my-37">
        <Faucet network={network} setNetwork={setNetwork} />
      </div>
      <Footer network={network} />
    </main>
  );
}
