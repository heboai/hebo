"use client";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

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

import { Button } from "../_shadcn/ui/button";

// Types based on models.schema.json
interface ModelEndpoint {
  baseUrl: string;
  provider: "aws" | "custom" | "openai";
  apiKey: string;
}

interface ModelConfig {
  alias: string;
  type: string;
  endpoint?: ModelEndpoint;
}

interface ModelsConfig {
  __supportedTypes: string[];
  models: ModelConfig[];
}

interface ChatProps {
  modelsConfig: ModelsConfig;
}

export function Chat({ modelsConfig }: ChatProps) {
  // Use the first (and currently only) model as default
  const defaultModel = modelsConfig.models[0];
  const [currentModelAlias, setCurrentModelAlias] = useState(
    defaultModel.alias,
  );
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Accessibility refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);

  // Get current model config
  const currentModel =
    modelsConfig.models.find((m) => m.alias === currentModelAlias) ||
    defaultModel;

  // Create OpenAI client based on current model
  const openai = createOpenAI({
    apiKey: currentModel.endpoint?.apiKey || "",
    baseURL: currentModel.endpoint?.baseUrl || "",
  });

  // Auto-scroll to latest message for screen readers
  useEffect(() => {
    if (latestMessageRef.current && messages.length > 0) {
      const lastMessage = messages.at(-1);
      if (lastMessage?.role === "assistant") {
        // Announce new assistant message to screen readers
        latestMessageRef.current.focus();
      }
    }
  }, [messages]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (but allow Shift+Enter for new lines)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(e as any);
        }
      }

      // Escape to focus/clear input
      if (e.key === "Escape") {
        if (input) {
          setInput("");
        } else {
          textareaRef.current?.blur();
        }
      }

      // Ctrl+R to reset conversation
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleReset();
      }
    },
    [input, isLoading],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

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
    <div className="flex h-full flex-col">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          aria-label="Clear conversation (Ctrl+R)"
          title="Clear conversation (Ctrl+R)"
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
          onKeyDown={handleKeyDown}
          value={input}
          disabled={isLoading}
          placeholder="Start prompting..."
          aria-label="Chat message input"
          aria-describedby="input-help"
          rows={1}
        />

        {/* Hidden help text */}
        <div id="input-help" className="sr-only">
          Press Enter to send message, Shift+Enter for new line, Escape to
          clear, Ctrl+R to reset conversation
        </div>

        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={handleModelChange}
              value={currentModelAlias}
              disabled={isLoading}
              aria-label="Select AI model"
            >
              <PromptInputModelSelectTrigger
                aria-label={`Current model: ${currentModel.alias}`}
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
            disabled={isLoading}
            aria-label="Attach file"
            title="Attach file"
          >
            <PaperclipIcon size={16} />
          </PromptInputButton>

          {/* Submit button */}
          <PromptInputSubmit
            disabled={!input.trim() || isLoading}
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
