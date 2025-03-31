"use client";

import { ExternalLink } from "./external-link";
import { communityLinks, ecosystemLinks } from "./links";
import { buildLinks } from "./links";
import { Logo } from "./logo";

type FooterSocialProps = {
  icon: string;
  href: string;
};

function FooterSocial({ icon, href }: FooterSocialProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border rounded-[8px] p-3 hover:bg-white/10 transition-all duration-300 group"
    >
      <img
        src={icon}
        alt={href}
        className="size-6 object-contain filter grayscale brightness-110 contrast-90 opacity-90 group-hover:filter-none"
      />
    </a>
  );
}

const socialLinks: FooterSocialProps[] = [
  { icon: "/logos/x.png", href: "https://x.com/Peersyst" },
  { icon: "/logos/discord.png", href: "https://discord.com/invite/xrplevm" },
  { icon: "/logos/github.png", href: "https://github.com/peersyst" },
];

export function Footer() {
  return (
    <footer className="relative px-4 md:px-0 backdrop-blur-xl bg-background/50 z-50 isolate overflow-x-hidden md:overflow-x-visible">
      <div className="border-t pt-8 justify-between relative max-w-4xl mx-auto w-full mb-[120px] grid grid-cols-2 md:flex">
        <div className="flex flex-col gap-6 z-10">
          <Logo />

          <div className="flex items-center gap-2">
            {socialLinks.map((link) => (
              <FooterSocial key={link.href} href={link.href} icon={link.icon} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 z-10">
          <p className="font-semibold">Build</p>
          {buildLinks.map((link) => (
            <div key={link.label}>
              <ExternalLink
                className="text-sm text-muted-foreground"
                onClick={
                  !link.external ? () => document.querySelector(link.href.toString())?.scrollIntoView({ behavior: "smooth" }) : undefined
                }
                {...link}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 z-10">
          <p className="font-semibold">Ecosystem</p>
          {ecosystemLinks.map((link) => (
            <div key={link.label}>
              <ExternalLink key={link.label} className="text-sm text-muted-foreground" {...link} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 z-10">
          <p className="font-semibold">Community</p>
          {communityLinks.map((link) => (
            <div key={link.label}>
              <ExternalLink key={link.label} className="text-sm text-muted-foreground" {...link} />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
