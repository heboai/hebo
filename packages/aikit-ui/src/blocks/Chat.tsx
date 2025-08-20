"use client";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { Bot, PaperclipIcon, IterationCcw } from "lucide-react";

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
import { useChat } from "../hooks/use-chat";
import { ChatMessage, ChatProps } from "../types/chat";

export default function Chat({ models, apiKey }: ChatProps) {
  const { state, actions } = useChat();

  const groqModel = createGroq({
    apiKey,
  });

  const handleReset = () => {
    actions.clearMessages();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!state.currentInput.trim()) return;

    actions.setLoading(true);
    actions.setError(undefined);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: state.currentInput }],
    };

    actions.addMessage(userMessage);
    actions.setInput("");

    try {
      // Prepare conversation history for API
      const conversationHistory = [...state.messages, userMessage].map(
        (msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.parts
            .filter((p) => p.type === "text")
            .map((p) => ({ type: "text" as const, text: p.text })),
        }),
      );

      // Generate AI response
      const { text: outputText } = await generateText({
        model: groqModel(state.currentModel),
        messages: conversationHistory,
      });

      // Add AI response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: outputText ?? "" }],
      };

      actions.addMessage(assistantMessage);
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Sorry, I encountered an error.",
          },
        ],
      };

      actions.addMessage(errorMessage);
      actions.setError("Failed to generate response");
    } finally {
      actions.setLoading(false);
    }
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
          {state.messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent>
                {m.parts
                  .filter((p) => p.type === "text")
                  .map((p, i) => (
                    <div key={`${m.id}-${i}`}>{p.text}</div>
                  ))}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <PromptInput onSubmit={handleSubmit} className="relative mt-4">
        <PromptInputTextarea
          onChange={(e) => actions.setInput(e.target.value)}
          value={state.currentInput}
          disabled={state.isLoading}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={actions.setModel}
              value={state.currentModel}
              disabled={state.isLoading}
            >
              <PromptInputModelSelectTrigger>
                <Bot />
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((m) => (
                  <PromptInputModelSelectItem key={m.id} value={m.id}>
                    {m.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>

          {/* Attachment button */}
          <PromptInputButton
            className="absolute right-10 bottom-1"
            disabled={state.isLoading}
          >
            <PaperclipIcon size={16} />
          </PromptInputButton>

          {/* Submit button */}
          <PromptInputSubmit
            disabled={!state.currentInput.trim() || state.isLoading}
            className="absolute right-1 bottom-1"
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
