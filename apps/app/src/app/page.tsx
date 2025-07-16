import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { CodeSnippet } from "@/components/CodeSnippet";
import { ActionButton } from "@/components/ActionButton";
import { UserDisplay } from "@/components/UserDisplay";
//import { RequireAuth } from "@/components/RequireAuth";

export default function Home() {
  return (
    //<RequireAuth>
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center p-8 pb-20 sm:p-20">
          <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
            <Logo />

            {/* User greeting section - static fallback with client enhancement */}
            <div className="relative">
              {/* Static fallback */}
              <p className="text-secondary-foreground text-center text-xl-sm md:text-xl">
                Hi User! Evaluate your custom <br /> agent or existing (fine-tuned) LLM
              </p>

              {/* Client component overlay */}
              <div className="absolute inset-0">
                <UserDisplay />
              </div>
            </div>

            {/* the blue command bar */}
            <CodeSnippet c="npm install -g hebo-eval@latest" />

            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <ActionButton variant="tertiary" text="New" />
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

        <footer className="w-full p-4">
          <Footer />
        </footer>
      </div>
    //</RequireAuth>
  );
}
