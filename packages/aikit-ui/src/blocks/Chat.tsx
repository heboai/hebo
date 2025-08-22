"use client";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";
import { useState, useCallback, useRef } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@hebo/aikit-ui/_ai-elements/conversation";
import {
  Message as Message,
  MessageContent,
} from "@hebo/aikit-ui/_ai-elements/message";
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
} from "@hebo/aikit-ui/_ai-elements/prompt-input";
import { Button } from "@hebo/aikit-ui/_shadcn/ui/button";

// Types based on models.schema.json
type ModelEndpoint = {
  baseUrl: string;
  provider: "openai";
  apiKey: string;
};

type ModelConfig = {
  alias: string;
  type: string;
  endpoint?: ModelEndpoint;
};

type ModelsConfig = {
  __supportedTypes: string[];
  models: ModelConfig[];
};

type ChatProps = { modelsConfig: ModelsConfig };

export function Chat({ modelsConfig }: ChatProps) {
  // Use lazy initializer to safely pick first model ID or empty string
  const [currentModelAlias, setCurrentModelAlias] = useState(() =>
    modelsConfig.models.length > 0 ? modelsConfig.models[0].alias : "",
  );
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Accessibility refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current model config - only return a model if we have a valid alias and it exists
  const currentModel = currentModelAlias
    ? modelsConfig.models.find((m) => m.alias === currentModelAlias)
    : undefined;

  // Create OpenAI client based on current model (only if model exists)
  const openai = currentModel
    ? createOpenAI({
        apiKey: currentModel.endpoint?.apiKey || "",
        baseURL: currentModel.endpoint?.baseUrl || "",
      })
    : undefined;

  const renderMessagePart = (part: UIMessage["parts"][0]) => {
    if (part.type === "text") return part.text;
    if (part.type === "dynamic-tool" && "input" in part) {
      return JSON.stringify(part.input);
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // No global keyboard handler; attach element-specific handlers below

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Guard against submission when no model is selected
      if (!input.trim() || isLoading || !currentModel || !openai) return;

      setIsLoading(true);

      // Add user message
      const userMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: input }],
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput(""); // Clear input immediately

      try {
        // Generate AI response using the current model's type
        const { text } = await generateText({
          model: openai.chat(currentModel.type),
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: renderMessagePart(msg.parts[0]),
          })),
        });

        // Add AI response
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
        // Return focus to textarea after response
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    },
    [input, isLoading, messages, currentModel, openai],
  );

  const handleReset = () => {
    setMessages([]);
    // Focus textarea after reset
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleModelChange = (modelAlias: string) => {
    setCurrentModelAlias(modelAlias);
    // Return focus to textarea after model change
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div className="flex h-full flex-col" ref={containerRef}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <IterationCcw size={20} />
        </Button>
      </div>

      {/* Live region for status updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "AI is thinking..."}
      </div>

      {/* Conversation area */}
      <Conversation>
        <ConversationContent
          role="log"
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
            >
              <MessageContent>
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
        className="relative mt-4"
        role="form"
        aria-label="Chat input form"
      >
        <PromptInputTextarea
          ref={textareaRef}
          id="chat-input"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (input) {
                setInput("");
              } else {
                textareaRef.current?.blur();
              }
            }
          }}
          value={input}
          disabled={isLoading}
          placeholder="Start prompting..."
          aria-label="Chat message input"
          aria-describedby="input-help"
          rows={1}
        />

        {/* Hidden help text */}
        <div id="input-help" className="sr-only">
          Press Enter to send message, Shift+Enter for new line, Escape to clear
        </div>

        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector - show hint when no models available */}
            {modelsConfig.models.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                No models available
              </div>
            ) : (
              <PromptInputModelSelect
                onValueChange={handleModelChange}
                value={currentModelAlias}
                disabled={isLoading || modelsConfig.models.length === 0}
                aria-label="Select AI model"
              >
                <PromptInputModelSelectTrigger
                  aria-label={`Current model: ${currentModel?.alias || "None"}`}
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
            )}
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
