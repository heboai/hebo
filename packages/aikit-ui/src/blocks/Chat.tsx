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

export type ChatFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function Chat({
  modelsConfig,
  fetch: chatFetch,
}: {
  modelsConfig: ModelsConfig;
  fetch?: ChatFetch;
}) {
  const [currentModelAlias, setCurrentModelAlias] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const aliases = modelsConfig.models.map((m) => m.alias);
    if (!currentModelAlias || !aliases.includes(currentModelAlias)) {
      setCurrentModelAlias(aliases[0] ?? "");
    }
  }, [modelsConfig, currentModelAlias]);

  // Get current model config - only return a model if we have a valid alias and it exists
  const currentModel = currentModelAlias
    ? modelsConfig.models.find((m) => m.alias === currentModelAlias)
    : undefined;

  // Create OpenAI client based on current model (only if model exists)
  const openai = currentModel
    ? createOpenAI({
        apiKey: "",
        baseURL: currentModel.endpoint?.baseUrl || "",
        fetch: currentModel.endpoint?.fetch || chatFetch || fetch,
      })
    : undefined;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+i or Cmd+i to focus chat input
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
        parts: [
          { type: "text", text: text || "Sorry, I encountered an error." },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
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
      <Conversation className="top-0">
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
              disabled={isLoading}
              aria-label="Select AI model"
            >
              <PromptInputModelSelectTrigger
                aria-label={`Current model: ${currentModelAlias}`}
              >
                <Bot />
                <PromptInputModelSelectValue />
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
