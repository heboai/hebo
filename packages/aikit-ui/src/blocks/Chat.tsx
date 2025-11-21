"use client";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";
import { Brain, Edit } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../_ai-elements/conversation";
import { Loader } from "../_ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "../_ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "../_ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../_ai-elements/reasoning";
import { Avatar, AvatarFallback } from "../_shadcn/ui/avatar";
import { Button } from "../_shadcn/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../_shadcn/ui/empty";

// Types based on models.schema.json
type ModelsConfig = Array<{
  alias: string;
  type?: string;
  endpoint?: {
    baseUrl: string;
    fetch?: typeof fetch;
  };
}>;

export function Chat({
  modelsConfig,
  name = "Hebo AI",
  reasoning = false,
}: {
  modelsConfig: ModelsConfig;
  name?: string;
  reasoning?: boolean;
}) {
  const [currentModelAlias, setCurrentModelAlias] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Set default model alias if non has been selected
  useEffect(() => {
    const aliases = modelsConfig.map((m) => m.alias);
    if (!currentModelAlias || !aliases.includes(currentModelAlias)) {
      setCurrentModelAlias(aliases[0] ?? "");
    }
  }, [modelsConfig, currentModelAlias]);

  // Get current model config for the selected alias
  const currentModel = currentModelAlias
    ? modelsConfig.find((m) => m.alias === currentModelAlias)
    : undefined;

  // Create OpenAI client based on current model
  const openai = currentModel
    ? createOpenAI({
        apiKey: "",
        baseURL: currentModel.endpoint?.baseUrl || "",
        fetch: currentModel.endpoint?.fetch || fetch,
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

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text || isLoading || !currentModel || !openai) return;

    setIsLoading(true);

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: message.text }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setText("");

    try {
      const { text } = await generateText({
        model: openai.chat(currentModel.type ?? currentModel.alias),
        messages: [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: renderMessagePart(msg.parts[0]),
        })),
        providerOptions: {
          openai: {
            reasoningEffot: "medium",
          },
        },
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
        metadata: { error: true },
        parts: [{ type: "text", text: "⚠️ Sorry, I encountered an error" }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col p-2 pt-12">
      {/* Header Controls */}
      <div className="absolute top-3 left-2">
        <Button
          disabled={!currentModelAlias}
          variant="ghost"
          size="icon"
          className="hover:bg-sidebar-accent size-7"
          onClick={() => setMessages([])}
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Edit />
        </Button>
      </div>

      {/* Conversation area */}
      <Conversation>
        <ConversationContent
          className="px-0 pt-0"
          aria-label="Chat conversation"
          tabIndex={-1}
        >
          {messages.length === 0 ? (
            <Empty className={currentModelAlias ? "" : "opacity-50"}>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <Avatar className="size-28">
                    <AvatarFallback className="text-7xl">🐵</AvatarFallback>
                  </Avatar>
                </EmptyMedia>
                <EmptyTitle className="text-3xl">{name}</EmptyTitle>
                <EmptyDescription>
                  Hi, how can I help you today?
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text": {
                        return (
                          <Message
                            from={message.role}
                            key={`${message.id}-${i}`}
                            tabIndex={-1}
                            role="article"
                            aria-label={`Message from ${message.role}`}
                            className="px-2"
                          >
                            <MessageContent className="">
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                        );
                      }
                      case "reasoning": {
                        return (
                          reasoning && (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={
                                status === "streaming" &&
                                i === message.parts.length - 1 &&
                                message.id === messages.at(-1)?.id
                              }
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          )
                        );
                      }
                      default: {
                        return;
                      }
                    }
                  })}
                </div>
              ))}
            </>
          )}
          {isLoading && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <PromptInput
        onSubmit={handleSubmit}
        role="form"
        className="bg-background"
      >
        <PromptInputBody>
          <PromptInputTextarea
            id="chat-input"
            disabled={!currentModelAlias}
            onChange={(e) => setText(e.target.value)}
            value={text}
            placeholder="Ask anything …"
            aria-label="Chat message input"
            aria-describedby="input-help"
            className="min-h-6"
          />

          {/* Hidden help text */}
          <div id="input-help" className="sr-only">
            Press Enter to send message, Shift+Enter for new line
          </div>
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools>
            {/* Model selector */}
            {modelsConfig.length > 1 && (
              <PromptInputSelect
                onValueChange={(alias) => setCurrentModelAlias(alias)}
                value={currentModelAlias}
                disabled={isLoading || modelsConfig.length === 0}
                aria-label="Select AI model"
              >
                <PromptInputSelectTrigger
                  aria-label={`Current model: ${currentModelAlias}`}
                  className="max-w-3xs px-2"
                >
                  <>
                    <Brain />
                    <PromptInputSelectValue className="truncate" />
                  </>
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {modelsConfig.map((model) => (
                    <PromptInputSelectItem
                      key={model.alias}
                      value={model.alias}
                    >
                      {model.alias.split("/").pop()}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            )}
          </PromptInputTools>

          {/* Submit button - disable when no model is selected */}
          <PromptInputSubmit
            disabled={!text || isLoading || !currentModel}
            aria-label={
              isLoading ? "Sending message..." : "Send message (Enter)"
            }
            title={isLoading ? "Sending message..." : "Send message (Enter)"}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
