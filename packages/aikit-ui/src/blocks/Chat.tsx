"use client";

import { createGroq } from "@ai-sdk/groq";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";
import { useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@hebo/aikit-ui/_ai-elements/conversation";
import { Message, MessageContent } from "@hebo/aikit-ui/_ai-elements/message";
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

export default function Chat({ models, apiKey }: ChatProps) {
  const [currentModel, setCurrentModel] = useState(models[0]?.id || "");

  const groqModel = createGroq({
    apiKey,
  });

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
    }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input immediately

    try {
      const { generateText } = await import("ai");

      // Prepare conversation history
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Generate AI response
      const { text: outputText } = await generateText({
        model: groqModel(currentModel),
        messages: conversationHistory,
      });

      // Add AI response
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: outputText || "Sorry, I encountered an error.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "Sorry, I encountered an error.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

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
                <div>{message.content}</div>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <PromptInput onSubmit={handleCustomSubmit} className="relative mt-4">
        <PromptInputTextarea
          onChange={handleInputChange}
          value={input}
          disabled={isLoading}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={setCurrentModel}
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
