import type { ImgHTMLAttributes } from "react";

type AgentLogoProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height"
> & {
  size?: number;
  alt?: string;
};

export function AgentLogo({
  size = 32,
  alt = "Agent Logo",
  ...props
}: AgentLogoProps) {
  return (
    <img
      src="/hebo-icon.png"
      alt={alt}
      {...props}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
