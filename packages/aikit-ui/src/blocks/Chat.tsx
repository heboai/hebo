"use client";

import { createGroq } from "@ai-sdk/groq";
import { generateText, type UIMessage } from "ai";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";
import { useState, useCallback } from "react";

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

  const groq = createGroq({
    apiKey,
  });

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
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: UIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: "Sorry, I encountered an error." }],
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, currentModel, groq],
  );

  const handleReset = useCallback(() => {
    setMessages([]);
  }, []);

  const handleModelChange = useCallback((modelId: string) => {
    setCurrentModel(modelId);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center">
        <Button variant="ghost" size="icon" onClick={handleReset}>
          <IterationCcw size={20} />
        </Button>
      </div>

      {/* Conversation area */}
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <div>{renderMessagePart(message.parts[0])}</div>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <PromptInput onSubmit={handleSubmit} className="relative mt-4">
        <PromptInputTextarea
          onChange={handleInputChange}
          value={input}
          disabled={isLoading}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={handleModelChange}
              value={currentModel}
              disabled={isLoading}
            >
              <PromptInputModelSelectTrigger>
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
          >
            <PaperclipIcon size={16} />
          </PromptInputButton>

          {/* Submit button */}
          <PromptInputSubmit
            disabled={!input.trim() || isLoading}
            className="absolute right-1 bottom-1"
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
