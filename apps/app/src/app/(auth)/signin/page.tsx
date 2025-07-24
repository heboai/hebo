import { Ban, BookOpen, CreditCard } from "lucide-react";

import { Badge } from "@hebo/ui/components/Badge";
import { Button } from "@hebo/ui/components/Button";

import { AuthProvider, MagicLinkSignIn, OAuthButtonGroup } from "~/components/auth/AuthProvider";
import { Logo } from "~/components/ui/Logo";

export default function SignIn() {
  return (
    <div className="min-h-screen relative">

      {/* Marketing Message */}
      <aside className="fixed w-128 min-h-screen bg-blue-100 bg-[url(/login-bg.png)] bg-bottom-left bg-no-repeat transition-transform duration-300 ease-in-out lg:translate-x-0 -translate-x-full">

        <Button 
          asChild
          className="absolute left-6 top-5 bg-blue-200 hover:bg-blue-300 text-foreground no-underline" 
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

        <div className="px-19 py-30 space-y-5 text-xl">
          <div className="flex gap-2 text-3xl font-semibold items-center">
            Hebo is{ }
            <Badge className="bg-lime-400 text-foreground text-3xl font-semibold">FREE</Badge>
          </div>
          <div className="space-y-2">          
            <div className="font-semibold">Deploy agents to production:</div>
            <ul className="space-y-2">
              <li>✔️ Choose from a set of free open-source models (Deepseek, Qwen, ...)</li>
              <li>✔️ Use commercial models (Claude,  Gemini, ChatGPT) within fair-usage</li> 
              <li>✔️ Link your custom inference endpoints to leverage existing credits</li> 
            </ul>
          </div>
          <span className="font-semibold">Save money</span> on commercial models with our built-in cache and optimised routing to the cheapest cloud provider.
        </div>
      </aside>

      {/* Login Components */}
      <main className="lg:ml-128 min-h-screen flex flex-1 items-center justify-center transition-all duration-300">
    
        <div className="w-xs flex flex-col gap-4 items-center">

          <Logo />
          <p className="text-base text-center">
            The fastest way to build & scale agents
          </p>

          <AuthProvider>
            <div className="w-full space-y-4">
              <OAuthButtonGroup type="sign-in" />
              <div className="flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-gray-300" />
                <span className="text-sm whitespace-nowrap">or</span>
                <div className="flex-1 h-[1px] bg-gray-300" />
              </div>
              <MagicLinkSignIn />
            </div>
          </AuthProvider>

          <div className="flex items-center gap-2">
            <span className="relative">
              <Ban className="w-4 h-4" />
              <CreditCard className="w-2 h-2 absolute left-1 top-1" />
            </span>
            <span className="text-sm">
              No credit card required
            </span>
          </div>
        </div>

      </main>

    </div>
  );
} 