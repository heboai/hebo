import { Message, MessageContent } from "@hebo/aikit-ui/_ai-elements/message";

function ChatBubble({
  from,
  content,
}: {
  from: "user" | "assistant";
  content: string;
}) {
  return (
    <Message from={from}>
      <MessageContent>
        <p>{content}</p>
      </MessageContent>
    </Message>
  );
}

export default ChatBubble;
