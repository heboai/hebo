import { AuthProvider } from "~/components/auth/AuthProvider";
import { UserButton } from "~/components/auth/UserButton";

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
        <AuthProvider>
          <UserButton />
        </AuthProvider>
      </footer>
    </div>
  );
}
