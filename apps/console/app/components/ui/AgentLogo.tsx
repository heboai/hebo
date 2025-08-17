import type { ImgHTMLAttributes } from "react";

type AgentLogoProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "src" | "width" | "height"
> & {
  size?: number;
};

export function AgentLogo({ size = 32, ...props }: AgentLogoProps) {
  return (
    <img
      src="/hebo-icon.png"
      alt="Agent Logo"
      {...props}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
