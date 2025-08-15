export function AgentLogo({ size = 32, ...props }: { size?: number }) {
  return (
    <img
      src="/hebo-icon.png"
      alt="Agent Logo"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
