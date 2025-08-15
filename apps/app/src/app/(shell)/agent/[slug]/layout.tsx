export default function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="max-w-2xl">{children}</div>;
}
