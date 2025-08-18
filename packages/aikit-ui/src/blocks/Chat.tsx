"use client";

import { useChat } from "@ai-sdk/react";
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
  const { messages, sendMessage, status } = useChat();
  const [text, setText] = useState("");
  const [model, setModel] = useState(models[0].id);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(
      { text: text },
      {
        body: {
          model: model,
        },
      },
    );
    setText('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation area */}
      <Conversation>
        <ConversationContent>
          {messages.map((m) => (
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
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Attachment button */}
            <PromptInputButton>
              <PaperclipIcon size={16} />
            </PromptInputButton>
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
