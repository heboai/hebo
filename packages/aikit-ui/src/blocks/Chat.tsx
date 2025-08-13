import { useChat } from "@ai-sdk/react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@hebo/aikit-ui/_ai-elements/conversation";
import { Message, MessageContent } from "@hebo/aikit-ui/_ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@hebo/aikit-ui/_ai-elements/prompt-input";

export default function ChatContainer() {
  const { messages, sendMessage, status } = useChat();

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
      <PromptInput
        onSubmit={() => sendMessage(messages.at(-1))}
        className="relative mt-4"
      >
        <PromptInputTextarea
          onChange={(e) => {
            console.log(e.target.value);
          }}
          value={""}
        />
        <PromptInputToolbar>
          <PromptInputSubmit
            className="absolute right-1 bottom-1"
            disabled={status !== "ready"}
            status={status}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
