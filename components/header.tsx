"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { HeaderNavigationMenu } from "./header-navigation-menu";
import { ExternalLinkWithArrow } from "./external-link";
import { buttonVariants } from "./ui/button";
import { ConnectWalletButton } from "./connect-wallet-button";
// If you still want to keep MetamaskHeaderButton for "Add Network", you can import it below.
// import { MetamaskHeaderButton } from "./metamask-button";

type NetworkType = "Devnet" | "Testnet";

export function Header({
  onAddressConnected,
}: {
  network: NetworkType;
  onAddressConnected?: (address: string) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "flex flex-col md:flex-row justify-between items-center px-4 pt-4 md:px-0 md:pt-0 md:pb-4 md:mt-6 relative w-full z-50 max-w-4xl mx-auto",
        isMenuOpen ? "md:border-b-0" : "md:border-b"
      )}
    >
      <div className="flex justify-between items-center w-full md:w-auto">
        <Logo />
        <div className="z-50 md:hidden">
          <ExternalLinkWithArrow
            className={buttonVariants({ variant: "default" })}
            label="Get started"
            href="https://docs.xrplevm.org/pages/users"
            external
          />
        </div>
      </div>

      <div className="w-full border-t md:border-0 mt-4 md:mt-0 md:absolute md:left-0 md:right-0 md:mx-auto md:justify-center">
        <HeaderNavigationMenu onOpenChange={setIsMenuOpen} />
      </div>

      <div className="hidden z-50 md:flex md:items-center md:gap-4">
        {/* The new ConnectWalletButton for connecting the user's account */}
        <ConnectWalletButton
          onConnected={(addr) => onAddressConnected?.(addr)}
        />

        {/* If you still want to keep "Add XRPL EVM" button in the header, you can re-add it:
           <MetamaskHeaderButton network={network} />
        */}

        <ExternalLinkWithArrow
          className={buttonVariants({ variant: "default", size: "lg" })}
          label="Get started"
          href="https://docs.xrplevm.org/pages/users"
          external
        />
      </div>
    </header>
  );
}
