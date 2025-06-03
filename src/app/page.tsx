import { stackServerApp } from "../stack";
import UserDisplay from "@/components/auth/UserDisplay";
import { Logo } from "@/components/common/Logo";
import { InstallCommand } from "@/components/common/InstallCommand";
import { NewButton } from "@/components/common/NewButton";
import { Footer } from "@/components/auth/Footer";

export default async function Home() {
  // Protect the page – redirect to /signup if not authenticated
  await stackServerApp.getUser({ or: "redirect" });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content area with flex-grow to push footer down */}
      <main className="flex flex-1 items-center justify-center p-8 pb-20 sm:p-20">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
          <Logo />
          <UserDisplay />
          {/* the blue command bar */}
          <InstallCommand />
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <NewButton />
            </div>
            <p className="text-base text-[#666666] min-w-[333px]">
              Works with any LLM / agent framework,{" "}
              <a 
                href="https://docs.hebo.ai/hebo_eval" 
                className="underline text-[#4758F5]"
                target="_blank" 
                rel="noopener noreferrer"
              >
                learn more
              </a>
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer fixed at bottom */}
      <footer className="w-full p-4">
        <Footer />
      </footer>
    </div>
  );
}
