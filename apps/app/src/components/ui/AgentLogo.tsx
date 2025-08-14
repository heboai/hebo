import Image, { ImageProps } from "next/image";

export function AgentLogo({
  width = 32,
  height = 32,
  ...props
}: Omit<ImageProps, "src" | "alt">) {
  return (
    <Image
      src="/hebo-icon.png"
      alt="Agent Logo"
      width={width}
      height={height}
      priority
      {...props}
    />
  );
}
