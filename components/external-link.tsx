import { ArrowUpRight, ChevronRight } from "lucide-react";
import { LinkProps } from "next/link";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ExternalLinkProps extends LinkProps {
  label: string;
  external?: boolean;
  className?: string;
}

export function ExternalLink({ label, external, className, ...props }: ExternalLinkProps) {
  return (
    <Link
      {...props}
      target={external ? "_blank" : undefined}
      className={cn("flex items-center gap-2 text-muted-foreground hover:text-secondary group", className)}
    >
      {label}
      {external && (
        <ArrowUpRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </Link>
  );
}

export function ExternalLinkWithArrow({ label, external, className, ...props }: ExternalLinkProps) {
  return (
    <Link
      {...props}
      target={external ? "_blank" : undefined}
      className={cn("flex items-center gap-2 text-foreground py-3 px-6 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] group", className)}
    >
      {label}

      <ChevronRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
