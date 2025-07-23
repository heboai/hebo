import { UserButton } from "~/components/ui/UserButton";
import { stackApp, StackProvider, StackTheme } from "~/lib/auth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col p-4 gap-4">
      <main className="w-full flex flex-1">
        {children}
      </main>
      <footer className="w-full flex flex-col items-left gap-2">
        <StackProvider app={stackApp}>
          <StackTheme>
            <UserButton />
          </StackTheme>
        </StackProvider>
      </footer>
    </div>
  );
}
