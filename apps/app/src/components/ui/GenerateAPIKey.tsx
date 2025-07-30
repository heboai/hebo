"use client";

import { KeyRound, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { cn } from "@hebo/ui/lib/utils";

import { authService } from "~/lib/auth";

export function GenerateAPIKey({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("Generate API Key ..");

  async function handleGenerateAPIKey() {
    setLoading(true);

    const newKey = await authService.generateAPIKey?.();
    setKey(newKey ?? "Failed to generate key");

    setLoading(false);
  }

  return (
    <div className={cn("flex flex-row gap-2", className)}>
      <Input readOnly icon={KeyRound} copy={true} value={key} />
      <Button
        disabled={loading}
        onClick={() => {
          handleGenerateAPIKey();
        }}
      >
        {loading && <Loader2Icon className="animate-spin" />}
        Generate
      </Button>
    </div>
  );
}
