"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/hebo-icon.svg"
        alt="Hebo AI Logo"
        width={32}
        height={32}
        priority
      />
      <span className="text-lg font-semibold">hebo.ai</span>
    </div>
  );
}; 