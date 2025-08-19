"use client";

import { createGroq } from "@ai-sdk/groq";
import { useChat } from "@ai-sdk/react";
import { generateText } from "ai";
import { PaperclipIcon } from "lucide-react";
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

const models = [
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
];

export default function Chat() {
  const { messages, setMessages, status } = useChat();
  const [text, setText] = useState("");
  const [model, setModel] = useState(models[0].id);
  const groqModel = createGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages as any);

    setText("");

    try {
      // Convert your message format to the format expected by generateText
      const conversationHistory = updatedMessages.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => ({ type: "text" as const, text: p.text })),
      }));

      const { text: outputText } = await generateText({
        model: groqModel(model),
        messages: conversationHistory,
      });

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: outputText ?? "" }],
      };

      setMessages((prev: any) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating text:", error);
      // Optionally add an error message to the conversation
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Sorry, I encountered an error. Please try again.",
          },
        ],
      };
      setMessages((prev: any) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation area */}
      <Conversation>
        <ConversationContent>
          {messages.map((m: any) => (
            <Message from={m.role} key={m.id}>
              <MessageContent>
                {m.parts
                  .filter((p: any) => p.type === "text")
                  .map((p: any, i: number) => (
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
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={(value) => setModel(value)}
              value={model}
            >
              <PromptInputModelSelectTrigger>
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
          <PromptInputButton className="absolute right-10 bottom-1">
            <PaperclipIcon size={16} />
          </PromptInputButton>
          {/* Submit button */}
          <PromptInputSubmit
            disabled={!text}
            status={status}
            className="absolute right-1 bottom-1"
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
