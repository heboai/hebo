import { Badge } from "@hebo/ui/components/Badge";
import { Code } from "@hebo/ui/components/Code";

import { AuthProvider } from "~/components/auth/AuthProvider";
import { UserName } from "~/components/auth/UserName";
import { Logo } from "~/components/ui/Logo";

export default function Home() {
  return (
      <div className="flex flex-col max-w-3xl mx-auto items-center justify-center text-center gap-4">
        <Logo />

        <AuthProvider>
            <p className="max-w-sm text-xl">
              Hi <UserName />! Evaluate your custom agent or existing (fine-tuned) LLM
            </p>
        </AuthProvider>

        <Code c="npm install -g hebo-eval@latest" />

        <div className="flex shrink gap-2">

          <Badge className="hidden sm:flex bg-green-600">New</Badge>

          <span className="text-base">
            Works with any LLM / agent framework,{" "}
            <a
              href="https://docs.hebo.ai/hebo_eval"
              target="_blank"
              rel="noopener noreferrer"
            >
              learn more
            </a>
          </span>
        </div>
      </div>
  );
}
