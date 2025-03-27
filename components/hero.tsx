"use client";

import dynamic from "next/dynamic";

const HeroHomeAnimation = dynamic(() => import("./hero-home-animation"), {
  ssr: false,
});

export function Hero() {
  return (
    <div className="w-full flex flex-col overflow-hidden justify-center items-center gap-[60px] md:pt[1px]">
      <div id="heroAnimation" className="flex flex-col gap-4 px-4 sm:px-0 overflow-hidden">
        <HeroHomeAnimation />
      </div>
    </div>
  );
}
