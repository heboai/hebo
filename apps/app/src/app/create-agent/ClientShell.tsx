"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStackApp } from "@stackframe/stack";
import { getSupportedModels } from '@/lib/models';
import NewAgentContent from "@/components/ui/NewAgentContent";
import { Footer } from '@/components/auth/Footer';

const ClientShell = () => {
  const [models, setModels] = useState<any[]>([]);
  const app = useStackApp();
  const user = app?.useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to /signin if not authenticated
    if (user === undefined) return; // still loading
    if (!user) {
      router.replace("/signin");
    }
  }, [user, router]);

  useEffect(() => {
    // Fetch models on the client
    const models = getSupportedModels();
    setModels(models);
  }, []);

  if (user === undefined) {
    // Optionally, show a loading state while checking auth
    return null;
  }
  if (!user) {
    // Redirecting...
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2">
          <img
            src="/hebo-icon.svg"
            alt="Hebo Logo"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold">Hebo</span>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <NewAgentContent models={models} />
      </main>
      <footer className="w-full p-4">
        <Footer />
      </footer>
    </div>
  );
};

export default ClientShell; 