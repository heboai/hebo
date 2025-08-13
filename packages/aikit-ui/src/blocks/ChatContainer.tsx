import { useChat } from "@ai-sdk/react";

import { Conversation } from "@hebo/aikit-ui/_ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
} from "@hebo/aikit-ui/_ai-elements/prompt-input";

import { Message, MessageContent } from "../_ai-elements/message";

export default function ChatContainer() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        {messages
          .filter((msg) => msg.role !== "data")
          .map((msg) => (
            <Message
              from={msg.role as "system" | "user" | "assistant"}
              key={msg.id}
            >
              <MessageContent>{msg.content}</MessageContent>
            </Message>
          ))}
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={handleInputChange}
          placeholder="Start prompting..."
        />
      </PromptInput>
    </div>
  );
}
