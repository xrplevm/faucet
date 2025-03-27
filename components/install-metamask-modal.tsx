"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";

interface InstallMetamaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallMetamaskModal({ open, onClose }: InstallMetamaskModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <h2 className="text-xl font-bold text-white">MetaMask Required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To connect your wallet and interact with XRPL EVM, you need to install MetaMask.
          <br />
          Once installed, you can reload this page to start.
        </p>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            variant="outline"
            className={cn("gap-2 border-white/20 bg-white/10 hover:bg-white/20 text-white")}
            onClick={() => window.open("https://docs.xrplevm.org/pages/users/getting-started/install-metamask", "_blank")}
          >
            <Icons.Metamask className="size-5" />
            Install MetaMask
          </Button>

          <Button
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
