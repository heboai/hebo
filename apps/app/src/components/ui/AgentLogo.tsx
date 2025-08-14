import Image, { ImageProps } from "next/image";

export function AgentLogo({
  size = 32,
  ...props
}: Omit<ImageProps, "src" | "width" | "height" | "alt"> & { size?: number }) {
  return (
    <Image
      src="/hebo-icon.png"
      alt="Agent Logo"
      width={size}
      height={size}
      priority
      {...props}
    />
  );
}
