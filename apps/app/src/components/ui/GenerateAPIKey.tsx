"use client";

import { KeyRound, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { cn } from "@hebo/ui/lib/utils";

export function GenerateAPIKey({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("Generate API Key ..");

  function generateAPIKey() {
    setLoading(true);

    setTimeout(() => {
      // TODO: connect to Stack Auth
      const generatedApiKey = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
      )
        .map(
          (x) =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
              x % 62
            ],
        )
        .join("");
      setKey(generatedApiKey);

      setLoading(false);
    }, 2000);
  }

  return (
    <div className={cn("flex flex-row gap-2", className)}>
      <Input readOnly icon={KeyRound} copy={true} value={key} />
      <Button
        disabled={loading}
        onClick={async () => {
          generateAPIKey();
        }}
      >
        {loading && <Loader2Icon className="animate-spin" />}
        Generate
      </Button>
    </div>
  );
}
