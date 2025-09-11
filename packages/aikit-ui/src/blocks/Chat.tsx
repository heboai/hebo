"use client";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../_ai-elements/conversation";
import { Message as Message, MessageContent } from "../_ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "../_ai-elements/prompt-input";
import { Button } from "../_shadcn/ui/button";

const kbdStyles =
  "inline-flex w-fit rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-mono font-medium text-muted-foreground shadow-sm";

// Types based on models.schema.json
type ModelsConfig = {
  models: Array<{
    alias: string;
    type: string;
    endpoint?: {
      baseUrl: string;
      fetch?: (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => Promise<Response>;
    };
  }>;
};

export function Chat({ modelsConfig }: { modelsConfig: ModelsConfig }) {
  const [currentModelAlias, setCurrentModelAlias] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Set default model alias if non has been selected
  useEffect(() => {
    const aliases = modelsConfig.models.map((m) => m.alias);
    if (!currentModelAlias || !aliases.includes(currentModelAlias)) {
      setCurrentModelAlias(aliases[0]);
    }
  }, [modelsConfig, currentModelAlias]);

  // Get current model config for the selected alias
  const currentModel = currentModelAlias
    ? modelsConfig.models.find((m) => m.alias === currentModelAlias)
    : undefined;

  // Create OpenAI client based on current model
  const openai = currentModel
    ? createOpenAI({
        apiKey: "",
        baseURL: currentModel.endpoint?.baseUrl || "",
        fetch:
          currentModel.endpoint?.fetch ||
          ((input: RequestInfo | URL, init?: RequestInit) =>
            fetch(input, {
              ...init,
              credentials: "include",
            })),
      })
    : undefined;

  // Shortcut: Ctrl/Cmd+i to focus chat input field
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        (document.querySelector("#chat-input") as HTMLTextAreaElement)?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const renderMessagePart = (part: UIMessage["parts"][0]) => {
    if (part.type === "text") return part.text;
    if (part.type === "dynamic-tool" && "input" in part) {
      return JSON.stringify(part.input);
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentModel || !openai) return;

    setIsLoading(true);

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: input }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const { text } = await generateText({
        model: openai.chat(currentModel.type),
        messages: [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: renderMessagePart(msg.parts[0]),
        })),
      });

      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: text }],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "system",
        parts: [{ type: "text", text: "Sorry, I encountered an error." }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col pt-12">
      {/* Header Controls */}
      <div className="absolute top-1.5 left-1.5 z-10 flex items-center">
        <Button
          disabled={!currentModelAlias}
          variant="ghost"
          size="icon"
          onClick={() => setMessages([])}
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <IterationCcw size={16} />
        </Button>
      </div>

      {/* Conversation area */}
      <Conversation className="top-0 flex">
        {messages.length > 0 ? (
          <ConversationContent
            className="px-3 py-0"
            aria-label="Chat conversation"
            tabIndex={-1}
          >
            {messages.map((message) => (
              <Message
                from={message.role}
                key={message.id}
                tabIndex={-1}
                role="article"
                aria-label={`Message from ${message.role}`}
                className="p-1"
              >
                <MessageContent className="px-3 py-2">
                  <div>{renderMessagePart(message.parts[0])}</div>
                </MessageContent>
              </Message>
            ))}
            {isLoading && (
              <Message from="assistant" key="loading">
                <MessageContent>
                  <div aria-live="polite">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
        ) : (
          <div className="text-muted-foreground m-auto flex flex-col justify-center gap-2 text-center">
            <div className="text-7xl">🐵</div>
            Open an agent and start chatting
            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
              <kbd className={kbdStyles}>⌘</kbd>/{" "}
              <kbd className={kbdStyles}>Ctrl</kbd>+{" "}
              <kbd className={kbdStyles}>I</kbd>
            </div>
          </div>
        )}
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <PromptInput
        onSubmit={handleSubmit}
        className="relative mt-4 border-x-0"
        role="form"
      >
        <PromptInputTextarea
          id="chat-input"
          disabled={!currentModelAlias}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Start prompting..."
          aria-label="Chat message input"
          aria-describedby="input-help"
          rows={1}
        />

        {/* Hidden help text */}
        <div id="input-help" className="sr-only">
          Press Enter to send message, Shift+Enter for new line
        </div>

        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={(alias) => setCurrentModelAlias(alias)}
              value={currentModelAlias}
              disabled={isLoading || modelsConfig.models.length === 0}
              aria-label="Select AI model"
            >
              <PromptInputModelSelectTrigger
                aria-label={`Current model: ${currentModelAlias}`}
              >
                <Bot />
                {modelsConfig.models.length > 0 ? (
                  <PromptInputModelSelectValue />
                ) : (
                  "No agent opened"
                )}
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {modelsConfig.models.map((model) => (
                  <PromptInputModelSelectItem
                    key={model.alias}
                    value={model.alias}
                  >
                    {model.alias}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>

          {/* Attachment button */}
          <PromptInputButton
            className="absolute right-10 bottom-1"
            disabled={isLoading || !currentModel}
            aria-label="Attach file"
            title="Attach file"
          >
            <PaperclipIcon size={16} />
          </PromptInputButton>

          {/* Submit button - disable when no model is selected */}
          <PromptInputSubmit
            disabled={!input.trim() || isLoading || !currentModel}
            className="absolute right-1 bottom-1"
            aria-label={
              isLoading ? "Sending message..." : "Send message (Enter)"
            }
            title={isLoading ? "Sending message..." : "Send message (Enter)"}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
