"use client";

import { KeyRound, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { cn } from "@hebo/aikit-ui/src/lib/utils";
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";

import { authService } from "~/lib/auth";

export function GenerateApiKey() {
  const [loading, setLoading] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [key, setKey] = useState("Generate API Key ...");
  const [error, setError] = useState("");

  async function handleGenerateAPIKey() {
    setLoading("loading");

    setError("");
    setKey("Generating API Key ...");

    try {
      const newKey = await authService.generateApiKey();
      setKey(newKey ?? "Failed to generate key");
      setLoading("success");
    } catch (error_) {
      setError((error_ as Error).message);
      setKey((error_ as Error).message);
      setLoading("idle");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-row gap-2",
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
        disabled={loading !== "idle"}
        aria-busy={loading === "loading"}
        onClick={() => {
          handleGenerateAPIKey();
        }}
        aria-label="Generate new API key"
      >
        {loading === "loading" && (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        )}
        Generate
      </Button>
    </div>
  );
}
