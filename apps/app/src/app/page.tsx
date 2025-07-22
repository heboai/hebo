import { stackApp, StackProvider } from "~/lib/auth";
import { Logo } from "~/components/ui/Logo";
import { UserButton } from "~/components/ui/UserButton";
import { UserName } from "~/components/ui/UserName";
import { ActionButton } from "@hebo/ui/components/ActionButton";
import { CodeSnippet } from "@hebo/ui/components/CodeSnippet";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-8 pb-20 sm:p-20">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
          <Logo />

          {/* User greeting section - needs auth */}
          <StackProvider app={stackApp}>
            <p className="text-secondary-foreground text-center text-xl-sm md:text-xl">
              Hi <UserName />, evaluate your custom <br /> agent or existing (fine-tuned) LLM
            </p>
          </StackProvider>

          {/* the blue command bar */}
          <CodeSnippet c="npm install -g hebo-eval@latest" />

          <div className="flex items-center gap-4">
            <div className="sm:flex hidden">
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
        <div className="flex flex-col items-left gap-2">
          <StackProvider app={stackApp}>
            <UserButton />
          </StackProvider>
        </div>
      </footer>
    </div>
  );
}
