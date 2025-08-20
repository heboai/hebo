"use client";

import { createGroq } from "@ai-sdk/groq";
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

interface Model {
  id: string;
  name: string;
}

interface ChatProps {
  models: Model[];
  apiKey: string;
}

export function Chat({ models, apiKey }: ChatProps) {
  const [currentModel, setCurrentModel] = useState(models[0]?.id || "");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Accessibility refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);

  const groq = createGroq({
    apiKey,
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

  const renderMessagePart = useCallback((part: UIMessage["parts"][0]) => {
    if (part.type === "text") return part.text;
    if (part.type === "dynamic-tool" && "input" in part) {
      return JSON.stringify(part.input);
    }
    return "";
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  // Enhanced keyboard handling
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
        // Generate AI response
        const { text } = await generateText({
          model: groq(currentModel),
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
    [input, isLoading, messages, currentModel, groq],
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    // Focus textarea after reset
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleModelChange = useCallback((modelId: string) => {
    setCurrentModel(modelId);
    // Return focus to textarea after model change
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

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
              value={currentModel}
              disabled={isLoading}
              aria-label="Select AI model"
            >
              <PromptInputModelSelectTrigger
                aria-label={`Current model: ${models.find((m) => m.id === currentModel)?.name || "Unknown"}`}
              >
                <Bot />
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem key={model.id} value={model.id}>
                    {model.name}
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
