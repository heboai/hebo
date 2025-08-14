"use client";

import { KeyRound, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { cn } from "@hebo/aikit-ui/src/lib/utils";
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";

import { authService } from "~/lib/auth";

export function GenerateApiKey({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("Generate API Key ...");
  const [error, setError] = useState("");

  async function handleGenerateAPIKey() {
    setLoading(true);

    setError("");
    setKey("Generating API Key ...");

    try {
      const newKey = await authService.generateApiKey?.();
      setKey(newKey ?? "Failed to generate key");
    } catch (error_) {
      setError((error_ as Error).message);
      setKey((error_ as Error).message);
    }

    setLoading(false);
  }

  return (
    <div
      className={cn(
        "flex flex-row gap-2",
        className,
        error ? "text-destructive" : "text-foreground",
      )}
    >
      <Input
        readOnly
        icon={KeyRound}
        copy={true}
        value={key}
        aria-label="Generated API key"
      />
      <Button
        disabled={loading}
        onClick={() => {
          handleGenerateAPIKey();
        }}
        aria-label="Generate new API key"
      >
        {loading && <Loader2Icon className="animate-spin" />}
        Generate
      </Button>
    </div>
  );
}
