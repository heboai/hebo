import { AuthUserButton, Logo, UserDisplay, RequireAuth, StackProvider, stackApp } from "@/components";
import { ActionButton } from "@hebo/ui";
import { CodeSnippetWrapper } from "@/components/CodeSnippetWrapper";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-8 pb-20 sm:p-20">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
          <Logo />

          {/* User greeting section - needs auth */}
          <StackProvider app={stackApp}>
            {/* <RequireAuth /> */}
            <UserDisplay />
          </StackProvider>

          {/* the blue command bar */}
          <CodeSnippetWrapper c="npm install -g hebo-eval@latest" />

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
            <AuthUserButton />
          </StackProvider>
        </div>
      </footer>
    </div>
  );
}
