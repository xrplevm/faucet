"use client";

import {
  NavigationMenu,

  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export function HeaderNavigationMenu({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <NavigationMenu className="w-full max-w-4xl" onValueChange={(value) => onOpenChange?.(!!value)}>
      <NavigationMenuList className="w-full justify-center gap-4">
      </NavigationMenuList>
    </NavigationMenu>
  );
}
