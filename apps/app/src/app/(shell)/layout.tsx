import ShellLayoutClient from "./ShellLayoutClient";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ShellLayoutClient>{children}</ShellLayoutClient>;
}
