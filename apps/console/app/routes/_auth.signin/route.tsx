import { Ban, BookOpen, CreditCard } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@hebo/ui/components/Badge";
import { Button } from "@hebo/ui/components/Button";
import { Skeleton } from "@hebo/ui/components/Skeleton";

import { AuthProvider } from "~/components/auth/AuthProvider";
import { MagicLinkSignIn } from "~/components/auth/MagicLinkSignIn";
import { OAuthSignIn } from "~/components/auth/OAuthSignIn";
import { Logo } from "~/components/ui/Logo";

export default function SignIn() {
  return (
    <div className="relative min-h-screen">
      {/* Marketing Message */}
      <aside className="fixed min-h-screen w-128 -translate-x-full bg-blue-100 bg-[url(/login-bg.png)] bg-bottom-left bg-no-repeat transition-transform duration-300 ease-in-out lg:translate-x-0">
        <Button
          asChild
          variant="ghost"
          className="text-foreground absolute top-5 left-6 bg-blue-200 no-underline hover:bg-blue-300"
        >
          <a
            href="https://docs.hebo.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen />
            Docs
          </a>
        </Button>

        <div className="space-y-5 px-19 py-30 text-xl">
          <div className="flex items-center gap-2 text-3xl font-semibold">
            Hebo is{}
            <Badge className="text-foreground bg-lime-400 text-3xl font-semibold">
              FREE
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Deploy agents to production:</div>
            <ul className="space-y-2">
              <li>
                ✔️ Choose from a set of free open-source models (Deepseek, Qwen,
                ...)
              </li>
              <li>
                ✔️ Use commercial models (Claude, Gemini, ChatGPT) within
                fair-usage
              </li>
              <li>
                ✔️ Link your custom inference endpoints to leverage existing
                credits
              </li>
            </ul>
          </div>
          <span className="font-semibold">Save money</span> on commercial models
          with our built-in cache and optimised routing to the cheapest cloud
          provider.
        </div>
      </aside>

      {/* Login Components */}
      <main className="flex min-h-screen flex-1 items-center justify-center transition-all duration-300 lg:ml-128">
        <div className="flex w-xs flex-col items-center gap-4">
          {/* AuthComponents may take a few seconds to load */}
          <Suspense fallback={<Skeleton className="h-10 w-full" count={5} />}>
            <AuthProvider>
              <Logo />
              <p className="text-center text-base">
                The fastest way to build & scale agents
              </p>

              <div className="w-full space-y-4">
                <OAuthSignIn />
                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gray-300" />
                  <span className="text-sm whitespace-nowrap">or</span>
                  <div className="h-[1px] flex-1 bg-gray-300" />
                </div>
                {/* FUTURE make the sign-in button use primary color (yellow)*/}
                {/* TODO fix spacings and documentation button */}
                <MagicLinkSignIn />
              </div>

              <div className="flex items-center gap-2">
                <span className="relative">
                  <Ban className="h-4 w-4" />
                  <CreditCard className="absolute top-1 left-1 h-2 w-2" />
                </span>
                <span className="text-sm">No credit card required</span>
              </div>
            </AuthProvider>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
