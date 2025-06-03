"use client";

import * as React from "react";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

// Create a wrapper component to ensure hooks are called in the correct context
function ApiKeyDisplayContent() {
    const user = useUser();
    const router = useRouter();

    const [apiKey, setApiKey] = React.useState<string | null>(null);
    const [fullKey, setFullKey] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const isNewKey = !!fullKey;
    
    // Add a ref to track if a request is in progress
    const isRequestInProgress = React.useRef(false);
    // Add a ref to track if we've already fetched the key
    const hasAttemptedFetch = React.useRef(false);

    const fetchApiKey = React.useCallback(async () => {
        if (!user || isRequestInProgress.current || hasAttemptedFetch.current) {
            setIsLoading(false);
            return;
        }

        try {
            isRequestInProgress.current = true;
            hasAttemptedFetch.current = true;
            setIsLoading(true);
            const res = await fetch("/api/keys/create", { method: "POST" });
            
            if (res.status === 401) {
                // Handle unauthorized state gracefully
                setIsLoading(false);
                return;
            }
            
            if (!res.ok) {
                throw new Error("Failed to fetch API key");
            }

            const { key } = await res.json();
            if (key) {
                setApiKey(key.displayValue);
                setFullKey(key.value ?? null);   // value is present only on 1st return (UserApiKeyFirstView)
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch API key");
        } finally {
            setIsLoading(false);
            isRequestInProgress.current = false;
        }
    }, [user]);

    // Only fetch API key when user changes and we don't have a key yet
    React.useEffect(() => {
        if (user && !apiKey && !isRequestInProgress.current && !hasAttemptedFetch.current) {
            fetchApiKey();
        }
    }, [user, apiKey, fetchApiKey]);

    const handleCopy = React.useCallback(async () => {
        if (!fullKey) return;
        try {
            await navigator.clipboard.writeText(fullKey);
            toast.success("API key copied to clipboard!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to copy API key");
        }
    }, [fullKey]);

    const handleRedirect = React.useCallback(() => {
        router.push('/handler/account-settings#api-keys');
    }, [router]);

    /* ---------- Render ---------- */

    if (!user) return null;

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Loader2 className="h-3 w-3 animate-spin" />
            </div>
        );
    }

    if (!apiKey) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-[#666666]">
            <span className="font-mono">{apiKey}</span>

            <Button
                onClick={isNewKey ? handleCopy : handleRedirect}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[#666666] hover:bg-gray-100"
                aria-label={isNewKey ? "Copy API key" : "Go to account settings"}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : isNewKey ? (
                    <Copy className="h-3 w-3" />
                ) : (
                    <ExternalLink className="h-3 w-3" />
                )}
            </Button>
        </div>
    );
}

// Export a wrapper component that ensures proper context
export function ApiKeyDisplay() {
    return (
        <React.Suspense fallback={null}>
            <ApiKeyDisplayContent />
        </React.Suspense>
    );
}
